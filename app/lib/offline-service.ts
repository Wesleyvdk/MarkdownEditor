export interface OfflineNote {
  sessionId: string
  noteId?: string
  title: string
  content: string
  tags: string[]
  userId: string
  timestamp: number
  attemptCount: number
}

export interface ConnectionStatus {
  isOnline: boolean
  lastOnlineTime: Date | null
  hasOfflineChanges: boolean
  syncInProgress: boolean
}

export class OfflineService {
  private readonly STORAGE_KEY = 'offline-notes'
  private readonly MAX_ATTEMPTS = 5
  private readonly SYNC_DELAY = 5000 // 5 seconds between sync attempts
  
  private connectionStatus: ConnectionStatus = {
    isOnline: navigator.onLine,
    lastOnlineTime: navigator.onLine ? new Date() : null,
    hasOfflineChanges: false,
    syncInProgress: false,
  }
  
  private syncTimer: NodeJS.Timeout | null = null
  private statusListeners = new Set<(status: ConnectionStatus) => void>()

  constructor() {
    this.initializeOfflineSupport()
    this.loadOfflineChanges()
  }

  private initializeOfflineSupport() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))
    
    // Periodic connectivity check
    setInterval(() => {
      this.checkConnectivity()
    }, 10000) // Check every 10 seconds
  }

  private handleOnline() {
    this.connectionStatus.isOnline = true
    this.connectionStatus.lastOnlineTime = new Date()
    this.notifyStatusChange()
    
    // Start syncing offline changes
    this.startSync()
  }

  private handleOffline() {
    this.connectionStatus.isOnline = false
    this.notifyStatusChange()
    
    // Stop sync attempts
    if (this.syncTimer) {
      clearTimeout(this.syncTimer)
      this.syncTimer = null
    }
  }

  private async checkConnectivity(): Promise<boolean> {
    try {
      // Try to fetch a small endpoint to verify actual connectivity
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        timeout: 5000,
      })
      
      const wasOffline = !this.connectionStatus.isOnline
      this.connectionStatus.isOnline = response.ok
      
      if (response.ok) {
        this.connectionStatus.lastOnlineTime = new Date()
        if (wasOffline) {
          this.handleOnline()
        }
      } else if (!wasOffline) {
        this.handleOffline()
      }
      
      return response.ok
    } catch (error) {
      if (this.connectionStatus.isOnline) {
        this.handleOffline()
      }
      return false
    }
  }

  /**
   * Store a note change for offline sync
   */
  async storeOfflineChange(note: Omit<OfflineNote, 'timestamp' | 'attemptCount'>): Promise<void> {
    const offlineNote: OfflineNote = {
      ...note,
      timestamp: Date.now(),
      attemptCount: 0,
    }

    const offlineNotes = this.getStoredOfflineNotes()
    
    // Remove any existing entry for the same session
    const filteredNotes = offlineNotes.filter(n => n.sessionId !== note.sessionId)
    filteredNotes.push(offlineNote)

    this.saveOfflineNotes(filteredNotes)
    this.connectionStatus.hasOfflineChanges = true
    this.notifyStatusChange()

    // Try to sync immediately if online
    if (this.connectionStatus.isOnline) {
      this.startSync()
    }
  }

  /**
   * Get all offline changes
   */
  getOfflineChanges(): OfflineNote[] {
    return this.getStoredOfflineNotes()
  }

  /**
   * Start syncing offline changes
   */
  private async startSync(): Promise<void> {
    if (this.connectionStatus.syncInProgress || !this.connectionStatus.isOnline) {
      return
    }

    const offlineNotes = this.getStoredOfflineNotes()
    if (offlineNotes.length === 0) {
      this.connectionStatus.hasOfflineChanges = false
      this.notifyStatusChange()
      return
    }

    this.connectionStatus.syncInProgress = true
    this.notifyStatusChange()

    try {
      await this.syncOfflineChanges(offlineNotes)
    } catch (error) {
      console.error('Sync failed:', error)
      // Schedule retry
      this.scheduleRetry()
    } finally {
      this.connectionStatus.syncInProgress = false
      this.notifyStatusChange()
    }
  }

  /**
   * Sync offline changes to server
   */
  private async syncOfflineChanges(offlineNotes: OfflineNote[]): Promise<void> {
    const successful: string[] = []
    const failed: OfflineNote[] = []

    for (const note of offlineNotes) {
      try {
        // Increment attempt count
        note.attemptCount++

        const response = await fetch('/api/notes/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: note.sessionId,
            noteId: note.noteId,
            title: note.title,
            content: note.content,
            tags: note.tags,
            userId: note.userId,
            timestamp: note.timestamp,
          }),
        })

        if (!response.ok) {
          throw new Error(`Sync failed: ${response.statusText}`)
        }

        const result = await response.json()
        console.log('Successfully synced note:', result.noteId)
        successful.push(note.sessionId)

      } catch (error) {
        console.error(`Failed to sync note ${note.sessionId}:`, error)
        
        // Only retry if we haven't exceeded max attempts
        if (note.attemptCount < this.MAX_ATTEMPTS) {
          failed.push(note)
        } else {
          console.error(`Giving up on note ${note.sessionId} after ${this.MAX_ATTEMPTS} attempts`)
          // Could notify user about permanent failure
        }
      }
    }

    // Update stored offline notes (remove successful, keep failed)
    this.saveOfflineNotes(failed)
    this.connectionStatus.hasOfflineChanges = failed.length > 0
    this.notifyStatusChange()

    // Schedule retry for failed notes
    if (failed.length > 0) {
      this.scheduleRetry()
    }
  }

  /**
   * Schedule a retry for failed syncs
   */
  private scheduleRetry(): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer)
    }

    this.syncTimer = setTimeout(() => {
      this.startSync()
    }, this.SYNC_DELAY)
  }

  /**
   * Get stored offline notes from localStorage
   */
  private getStoredOfflineNotes(): OfflineNote[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to load offline notes:', error)
      return []
    }
  }

  /**
   * Save offline notes to localStorage
   */
  private saveOfflineNotes(notes: OfflineNote[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notes))
    } catch (error) {
      console.error('Failed to save offline notes:', error)
      // Handle storage quota exceeded
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.cleanupOldOfflineNotes()
        // Try again after cleanup
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notes))
        } catch (retryError) {
          console.error('Failed to save offline notes after cleanup:', retryError)
        }
      }
    }
  }

  /**
   * Clean up old offline notes to free space
   */
  private cleanupOldOfflineNotes(): void {
    const offlineNotes = this.getStoredOfflineNotes()
    
    // Remove notes older than 7 days
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000)
    const recentNotes = offlineNotes.filter(note => note.timestamp > cutoffTime)
    
    // If still too many, keep only the most recent 100
    const finalNotes = recentNotes.length > 100 
      ? recentNotes.sort((a, b) => b.timestamp - a.timestamp).slice(0, 100)
      : recentNotes
    
    this.saveOfflineNotes(finalNotes)
  }

  /**
   * Load offline changes on initialization
   */
  private loadOfflineChanges(): void {
    const offlineNotes = this.getStoredOfflineNotes()
    this.connectionStatus.hasOfflineChanges = offlineNotes.length > 0
    
    if (this.connectionStatus.hasOfflineChanges && this.connectionStatus.isOnline) {
      // Start syncing immediately
      setTimeout(() => this.startSync(), 1000)
    }
  }

  /**
   * Subscribe to connection status changes
   */
  onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(listener)
    
    // Return unsubscribe function
    return () => {
      this.statusListeners.delete(listener)
    }
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return { ...this.connectionStatus }
  }

  /**
   * Force sync attempt
   */
  async forceSync(): Promise<void> {
    await this.startSync()
  }

  /**
   * Clear all offline data (use with caution)
   */
  clearOfflineData(): void {
    this.saveOfflineNotes([])
    this.connectionStatus.hasOfflineChanges = false
    this.notifyStatusChange()
  }

  /**
   * Get storage usage info
   */
  getStorageInfo(): { used: number; available?: number; itemCount: number } {
    const offlineNotes = this.getStoredOfflineNotes()
    const stored = localStorage.getItem(this.STORAGE_KEY) || ''
    
    return {
      used: new Blob([stored]).size,
      available: this.estimateAvailableStorage(),
      itemCount: offlineNotes.length,
    }
  }

  private estimateAvailableStorage(): number | undefined {
    try {
      // Estimate based on localStorage quota (usually 5-10MB)
      const testKey = 'storage-test-' + Date.now()
      let size = 0
      const increment = 1024 * 1024 // 1MB chunks
      
      while (size < 10 * 1024 * 1024) { // Max 10MB test
        try {
          localStorage.setItem(testKey + size, 'x'.repeat(increment))
          size += increment
        } catch {
          localStorage.removeItem(testKey + size)
          return size
        }
      }
      
      // Clean up test data
      for (let i = 0; i < size; i += increment) {
        localStorage.removeItem(testKey + i)
      }
      
      return size
    } catch {
      return undefined
    }
  }

  private notifyStatusChange(): void {
    this.statusListeners.forEach(listener => {
      try {
        listener({ ...this.connectionStatus })
      } catch (error) {
        console.error('Error in status change listener:', error)
      }
    })
  }
}

// Singleton instance
export const offlineService = new OfflineService()