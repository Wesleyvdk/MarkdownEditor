import { useCallback, useEffect, useRef, useState } from 'react'
import { autoSaveService, type AutoSaveState } from '../lib/auto-save-service'
import type { Note } from '../types/database'

export interface UseAutoSaveOptions {
  userId: string
  sessionId: string
  debounceMs?: number
  onSave?: (note: Note) => void
  onError?: (error: Error) => void
  onStateChange?: (state: AutoSaveState | null) => void
}

export interface AutoSaveStatus {
  isSaving: boolean
  lastSaved: Date | null
  hasUnsavedChanges: boolean
  saveError: Error | null
}

export function useAutoSave(options: UseAutoSaveOptions) {
  const { userId, sessionId, onSave, onError, onStateChange } = options
  
  const [status, setStatus] = useState<AutoSaveStatus>({
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    saveError: null,
  })

  const statusRef = useRef(status)
  statusRef.current = status

  // Update status from auto-save state
  const updateStatus = useCallback(() => {
    const state = autoSaveService.getSaveState(sessionId)
    
    const newStatus: AutoSaveStatus = {
      isSaving: state?.saveInProgress ?? false,
      lastSaved: state?.lastSaved && state.lastSaved.getTime() > 0 ? state.lastSaved : null,
      hasUnsavedChanges: state?.isDirty ?? false,
      saveError: null, // Will be set by error handling
    }

    setStatus(newStatus)
    
    if (onStateChange && state) {
      onStateChange(state)
    }
  }, [sessionId, onStateChange])

  // Schedule save function
  const scheduleSave = useCallback((title: string, content: string, tags: string[] = []) => {
    autoSaveService.scheduleSave(sessionId, {
      userId,
      title,
      content,
      tags,
    })
    
    // Update status immediately to reflect dirty state
    setStatus(prev => ({ ...prev, hasUnsavedChanges: true }))
  }, [userId, sessionId])

  // Force save function
  const forceSave = useCallback(async (): Promise<Note | null> => {
    try {
      setStatus(prev => ({ ...prev, isSaving: true, saveError: null }))
      
      const note = await autoSaveService.forceSave(sessionId)
      
      if (note && onSave) {
        onSave(note)
      }
      
      updateStatus()
      return note
      
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Save failed')
      
      setStatus(prev => ({ 
        ...prev, 
        isSaving: false, 
        saveError: errorObj 
      }))
      
      if (onError) {
        onError(errorObj)
      }
      
      return null
    }
  }, [sessionId, onSave, onError, updateStatus])

  // Rename document
  const renameDocument = useCallback((newSessionId: string, newTitle: string) => {
    autoSaveService.renameDocument(sessionId, newSessionId, newTitle)
  }, [sessionId])

  // Get current note ID
  const getNoteId = useCallback(() => {
    return autoSaveService.getNoteId(sessionId)
  }, [sessionId])

  // Periodic status updates
  useEffect(() => {
    const interval = setInterval(updateStatus, 1000) // Update every second
    return () => clearInterval(interval)
  }, [updateStatus])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      autoSaveService.cleanup(sessionId)
    }
  }, [sessionId])

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasUnsaved = autoSaveService.hasUnsavedChanges(sessionId)
      if (hasUnsaved) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        
        // Attempt to save on page unload (though this may not complete)
        autoSaveService.forceSave(sessionId).catch(console.error)
        
        return e.returnValue
      }
    }

    const handleUnload = () => {
      // Final attempt to save
      const hasUnsaved = autoSaveService.hasUnsavedChanges(sessionId)
      if (hasUnsaved) {
        // Use navigator.sendBeacon for best chance of sending data on unload
        const state = autoSaveService.getSaveState(sessionId)
        if (state) {
          try {
            const data = JSON.stringify({
              sessionId,
              noteId: state.noteId,
              title: state.title,
              content: state.content,
              tags: state.tags,
              userId: state.userId,
            })
            
            // Send to a dedicated endpoint that handles emergency saves
            navigator.sendBeacon('http://localhost:3010/api/emergency-save', data)
          } catch (error) {
            console.error('Emergency save failed:', error)
          }
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('unload', handleUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('unload', handleUnload)
    }
  }, [sessionId])

  return {
    status,
    scheduleSave,
    forceSave,
    renameDocument,
    getNoteId,
  }
}

// Additional hook for managing multiple documents (e.g., tabs)
export function useMultiDocumentAutoSave(userId: string) {
  const [sessions] = useState(() => new Map<string, ReturnType<typeof useAutoSave>>())

  const createSession = useCallback((sessionId: string, options?: Omit<UseAutoSaveOptions, 'userId' | 'sessionId'>) => {
    // This would be implemented to manage multiple auto-save sessions
    // For now, return placeholder
    return {
      scheduleSave: (title: string, content: string, tags?: string[]) => {},
      forceSave: async () => null,
      renameDocument: (newSessionId: string, newTitle: string) => {},
      getNoteId: () => null,
      status: {
        isSaving: false,
        lastSaved: null,
        hasUnsavedChanges: false,
        saveError: null,
      },
    }
  }, [userId])

  const removeSession = useCallback((sessionId: string) => {
    autoSaveService.cleanup(sessionId)
    sessions.delete(sessionId)
  }, [sessions])

  const saveAllSessions = useCallback(async () => {
    await autoSaveService.saveAllPending()
  }, [])

  return {
    createSession,
    removeSession,
    saveAllSessions,
    getQueueSize: () => autoSaveService.getQueueSize(),
  }
}