import type { Note, NewNote } from '../database/schema'

export interface AutoSaveState {
  noteId?: string
  title: string
  content: string
  tags: string[]
  isDirty: boolean
  lastSaved: Date
  saveInProgress: boolean
  version: number
  userId: string
}

export interface AutoSaveOptions {
  debounceMs?: number
  retryAttempts?: number
  retryDelayMs?: number
  batchSize?: number
}

export class ClientAutoSaveService {
  private saveQueue = new Map<string, AutoSaveState>()
  private timers = new Map<string, NodeJS.Timeout>()
  private retryTimers = new Map<string, NodeJS.Timeout>()
  private readonly options: Required<AutoSaveOptions>
  
  // For handling document renaming without orphaning
  private documentIdMap = new Map<string, string>() // temporary ID -> actual note ID
  
  constructor(options: AutoSaveOptions = {}) {
    this.options = {
      debounceMs: options.debounceMs ?? 7000, // 7 seconds default
      retryAttempts: options.retryAttempts ?? 3,
      retryDelayMs: options.retryDelayMs ?? 2000, // 2 seconds between retries
      batchSize: options.batchSize ?? 50, // Max concurrent saves
    }
  }

  /**
   * Schedule a save for the given document state
   * This is called every time the user types
   */
  scheduleSave(sessionId: string, state: Partial<AutoSaveState> & { userId: string; title: string; content: string }): void {
    const existingState = this.saveQueue.get(sessionId)
    
    // Update or create the save state
    const updatedState: AutoSaveState = {
      noteId: existingState?.noteId || state.noteId,
      title: state.title,
      content: state.content,
      tags: state.tags || existingState?.tags || [],
      isDirty: true,
      lastSaved: existingState?.lastSaved || new Date(),
      saveInProgress: false,
      version: (existingState?.version || 0) + 1,
      userId: state.userId,
    }

    this.saveQueue.set(sessionId, updatedState)

    // Clear existing timer
    const existingTimer = this.timers.get(sessionId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // Set new timer for debounced save
    const timer = setTimeout(() => {
      this.executeSave(sessionId)
    }, this.options.debounceMs)

    this.timers.set(sessionId, timer)
  }

  async forceSave(sessionId: string): Promise<Note | null> {
    const timer = this.timers.get(sessionId)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(sessionId)
    }

    return this.executeSave(sessionId)
  }

  private async executeSave(sessionId: string, retryCount = 0): Promise<Note | null> {
    const state = this.saveQueue.get(sessionId)
    if (!state || state.saveInProgress) {
      return null
    }

    // Mark as save in progress
    state.saveInProgress = true
    this.saveQueue.set(sessionId, state)

    try {
      // Use fetch to call the API route instead of direct database access
      const noteData: NewNote = {
        title: state.title,
        content: state.content,
        tags: state.tags,
        userId: state.userId,
      }

      let response: Response
      if (state.noteId) {
        // Update existing note - include userId as query parameter
        response = await fetch(`/api/notes/${state.noteId}?userId=${encodeURIComponent(state.userId)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: noteData.title,
            content: noteData.content,
            tags: noteData.tags,
          }),
        })
      } else {
        // Create new note
        response = await fetch('/api/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(noteData),
        })
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const savedNote: Note = await response.json()

      // Update state with saved note info
      state.noteId = savedNote.id
      state.isDirty = false
      state.lastSaved = new Date()
      state.saveInProgress = false
      this.saveQueue.set(sessionId, state)

      // Store mapping for future reference
      this.documentIdMap.set(sessionId, savedNote.id)

      return savedNote
    } catch (error) {
      state.saveInProgress = false
      this.saveQueue.set(sessionId, state)

      if (this.isNetworkError(error) && retryCount < this.options.retryAttempts) {
        // Schedule retry
        const retryTimer = setTimeout(() => {
          this.executeSave(sessionId, retryCount + 1)
        }, this.options.retryDelayMs * (retryCount + 1)) // Exponential backoff

        this.retryTimers.set(sessionId, retryTimer)
      } else {
        console.error('Auto-save failed:', error)
        // Store offline for later sync
        this.storeOffline(sessionId, state)
      }

      return null
    }
  }

  private isNetworkError(error: unknown): boolean {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true
    }
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      return message.includes('network') || 
             message.includes('connection') || 
             message.includes('timeout') ||
             message.includes('offline')
    }
    return false
  }

  private storeOffline(sessionId: string, state: AutoSaveState): void {
    try {
      const offlineKey = `offline_note_${sessionId}`
      localStorage.setItem(offlineKey, JSON.stringify({
        ...state,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.error('Failed to store offline note:', error)
    }
  }

  renameDocument(oldSessionId: string, newSessionId: string, newTitle: string): void {
    const state = this.saveQueue.get(oldSessionId)
    if (state) {
      // Update title and move to new session ID
      state.title = newTitle
      state.isDirty = true
      this.saveQueue.set(newSessionId, state)
      
      // Clean up old session
      this.cleanup(oldSessionId)
      
      // Update document ID mapping
      const noteId = this.documentIdMap.get(oldSessionId)
      if (noteId) {
        this.documentIdMap.set(newSessionId, noteId)
        this.documentIdMap.delete(oldSessionId)
      }
    }
  }

  getSaveState(sessionId: string): AutoSaveState | null {
    return this.saveQueue.get(sessionId) || null
  }

  hasUnsavedChanges(sessionId: string): boolean {
    const state = this.saveQueue.get(sessionId)
    return state?.isDirty || false
  }

  getNoteId(sessionId: string): string | null {
    const state = this.saveQueue.get(sessionId)
    return state?.noteId || this.documentIdMap.get(sessionId) || null
  }

  cleanup(sessionId: string): void {
    // Clear timers
    const timer = this.timers.get(sessionId)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(sessionId)
    }

    const retryTimer = this.retryTimers.get(sessionId)
    if (retryTimer) {
      clearTimeout(retryTimer)
      this.retryTimers.delete(sessionId)
    }

    // Remove from queue and mappings
    this.saveQueue.delete(sessionId)
    this.documentIdMap.delete(sessionId)
  }

  getQueueSize(): number {
    return this.saveQueue.size
  }

  getPendingSaves(): Array<{ sessionId: string; state: AutoSaveState }> {
    const pending: Array<{ sessionId: string; state: AutoSaveState }> = []
    
    for (const [sessionId, state] of this.saveQueue.entries()) {
      if (state.isDirty || state.saveInProgress) {
        pending.push({ sessionId, state })
      }
    }
    
    return pending
  }

  async saveAllPending(): Promise<void> {
    const pending = this.getPendingSaves()
    const savePromises = pending.map(({ sessionId }) => this.forceSave(sessionId))
    await Promise.allSettled(savePromises)
  }
}

export const clientAutoSaveService = new ClientAutoSaveService()
export type { AutoSaveState, AutoSaveOptions }