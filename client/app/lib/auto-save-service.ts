// Notes service is now handled by the Fastify backend via HTTP
import { offlineService, getOfflineService } from './offline-service'
import type { Note } from '../types/database'

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

export class AutoSaveService {
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
      noteId: existingState?.noteId,
      title: state.title,
      content: state.content,
      tags: state.tags ?? existingState?.tags ?? [],
      isDirty: true,
      lastSaved: existingState?.lastSaved ?? new Date(0),
      saveInProgress: existingState?.saveInProgress ?? false,
      version: (existingState?.version ?? 0) + 1,
      userId: state.userId,
    }
    
    this.saveQueue.set(sessionId, updatedState)
    
    // Clear existing timer
    const existingTimer = this.timers.get(sessionId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }
    
    // Set new debounced timer
    const timer = setTimeout(() => {
      this.executeSave(sessionId)
    }, this.options.debounceMs)
    
    this.timers.set(sessionId, timer)
  }

  /**
   * Force immediate save (e.g., when user navigates away)
   */
  async forceSave(sessionId: string): Promise<Note | null> {
    const state = this.saveQueue.get(sessionId)
    if (!state || !state.isDirty) {
      return null
    }

    // Clear any pending timer
    const timer = this.timers.get(sessionId)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(sessionId)
    }

    return await this.executeSave(sessionId)
  }

  /**
   * Execute the actual save operation
   */
  private async executeSave(sessionId: string, retryCount = 0): Promise<Note | null> {
    const state = this.saveQueue.get(sessionId)
    if (!state || !state.isDirty || state.saveInProgress) {
      return null
    }

    // Mark as save in progress
    state.saveInProgress = true
    this.saveQueue.set(sessionId, state)

    try {
      let note: Note

      // TODO: Replace with actual database calls when ready
      // For now, simulate a successful save
      const mockNote = {
        id: state.noteId || `note-${Date.now()}`,
        title: state.title,
        content: state.content,
        tags: state.tags,
        userId: state.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        contentHash: 'mock-hash',
        r2ObjectKey: 'mock-key',
        fileSize: state.content.length,
        lastAccessedAt: new Date(),
      }

      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 100))

      if (!state.noteId) {
        // Update state with new note ID for new notes
        state.noteId = mockNote.id
        this.documentIdMap.set(sessionId, mockNote.id)
      }

      note = mockNote as any

      // Mark as saved
      state.isDirty = false
      state.lastSaved = new Date()
      state.saveInProgress = false
      this.saveQueue.set(sessionId, state)

      // Clean up timers
      this.timers.delete(sessionId)
      this.retryTimers.delete(sessionId)

      return note

    } catch (error) {
      console.error('Auto-save failed:', error)
      
      state.saveInProgress = false
      this.saveQueue.set(sessionId, state)

      // Check if this is a network error - if so, store for offline sync
      if (this.isNetworkError(error) && typeof window !== 'undefined' && offlineService) {
        console.log('Network error detected, storing for offline sync')
        await offlineService.storeOfflineChange({
          sessionId,
          noteId: state.noteId,
          title: state.title,
          content: state.content,
          tags: state.tags,
          userId: state.userId,
        })
        
        // Mark as "saved" offline
        state.isDirty = false
        state.lastSaved = new Date()
        this.saveQueue.set(sessionId, state)
        
        return null // Return null to indicate offline storage
      }

      // Retry logic for non-network errors
      if (retryCount < this.options.retryAttempts) {
        const retryTimer = setTimeout(() => {
          this.executeSave(sessionId, retryCount + 1)
        }, this.options.retryDelayMs * Math.pow(2, retryCount)) // Exponential backoff
        
        this.retryTimers.set(sessionId, retryTimer)
      } else {
        console.error(`Auto-save failed after ${this.options.retryAttempts} attempts for session ${sessionId}`)
        
        // As last resort, try to store offline
        try {
          if (typeof window !== 'undefined' && offlineService) {
            await offlineService.storeOfflineChange({
              sessionId,
              noteId: state.noteId,
              title: state.title,
              content: state.content,
              tags: state.tags,
              userId: state.userId,
            })
            
            state.isDirty = false
            state.lastSaved = new Date()
            this.saveQueue.set(sessionId, state)
          }
        } catch (offlineError) {
          console.error('Failed to store offline as well:', offlineError)
        }
      }

      return null
    }
  }

  /**
   * Check if error is network-related
   */
  private isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      return (
        message.includes('network') ||
        message.includes('fetch') ||
        message.includes('timeout') ||
        message.includes('connection') ||
        message.includes('offline') ||
        error.name === 'TypeError' && message.includes('failed to fetch')
      )
    }
    return false
  }

  /**
   * Handle document renaming - maps old session to new session ID
   */
  renameDocument(oldSessionId: string, newSessionId: string, newTitle: string): void {
    const state = this.saveQueue.get(oldSessionId)
    if (!state) return

    // Update title and move to new session ID
    const newState: AutoSaveState = {
      ...state,
      title: newTitle,
      isDirty: true,
      version: state.version + 1,
    }

    this.saveQueue.set(newSessionId, newState)
    this.saveQueue.delete(oldSessionId)

    // Move timers
    const timer = this.timers.get(oldSessionId)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(oldSessionId)
      
      // Schedule save for new session
      const newTimer = setTimeout(() => {
        this.executeSave(newSessionId)
      }, this.options.debounceMs)
      this.timers.set(newSessionId, newTimer)
    }

    // Update document ID mapping
    if (state.noteId) {
      this.documentIdMap.set(newSessionId, state.noteId)
    }
    this.documentIdMap.delete(oldSessionId)
  }

  /**
   * Get current save state for a session
   */
  getSaveState(sessionId: string): AutoSaveState | null {
    return this.saveQueue.get(sessionId) ?? null
  }

  /**
   * Check if a document has unsaved changes
   */
  hasUnsavedChanges(sessionId: string): boolean {
    const state = this.saveQueue.get(sessionId)
    return state?.isDirty ?? false
  }

  /**
   * Get the actual note ID for a session (handles renaming)
   */
  getNoteId(sessionId: string): string | null {
    const state = this.saveQueue.get(sessionId)
    return state?.noteId ?? this.documentIdMap.get(sessionId) ?? null
  }

  /**
   * Clean up resources for a session (e.g., when editor closes)
   */
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

    // Remove from queue (but keep if save is in progress)
    const state = this.saveQueue.get(sessionId)
    if (state && !state.saveInProgress) {
      this.saveQueue.delete(sessionId)
    }

    this.documentIdMap.delete(sessionId)
  }

  /**
   * Get queue size for monitoring
   */
  getQueueSize(): number {
    return this.saveQueue.size
  }

  /**
   * Get offline status
   */
  getOfflineStatus() {
    if (typeof window !== 'undefined' && offlineService) {
      return offlineService.getStatus()
    }
    return {
      isOnline: true,
      lastOnlineTime: new Date(),
      hasOfflineChanges: false,
      syncInProgress: false,
    }
  }

  /**
   * Force sync offline changes
   */
  async syncOfflineChanges(): Promise<void> {
    if (typeof window !== 'undefined' && offlineService) {
      await offlineService.forceSync()
    }
  }

  /**
   * Get all pending saves (for debugging/monitoring)
   */
  getPendingSaves(): Array<{ sessionId: string; state: AutoSaveState }> {
    return Array.from(this.saveQueue.entries()).map(([sessionId, state]) => ({
      sessionId,
      state,
    }))
  }

  /**
   * Batch save all pending changes (useful for server shutdown)
   */
  async saveAllPending(): Promise<void> {
    const pendingSaves = Array.from(this.saveQueue.entries())
      .filter(([_, state]) => state.isDirty && !state.saveInProgress)
      .slice(0, this.options.batchSize) // Respect batch size limit

    const savePromises = pendingSaves.map(([sessionId]) => this.forceSave(sessionId))
    
    await Promise.allSettled(savePromises)
  }
}

// Singleton instance for the application
export const autoSaveService = new AutoSaveService()

// Export types
export type { AutoSaveState, AutoSaveOptions }