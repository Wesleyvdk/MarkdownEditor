"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useAutoSave } from '../hooks/use-auto-save'
import { generateSessionId } from '../lib/client-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, CheckCircle, Clock, Save, X } from 'lucide-react'

interface NoteEditorProps {
  userId: string
  noteId?: string
  initialTitle?: string
  initialContent?: string
  initialTags?: string[]
  onSaved?: (noteId: string) => void
  onClose?: () => void
}

export function NoteEditor({
  userId,
  noteId,
  initialTitle = '',
  initialContent = '',
  initialTags = [],
  onSaved,
  onClose,
}: NoteEditorProps) {
  const sessionId = useRef(generateSessionId()).current
  
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [tags, setTags] = useState<string[]>(initialTags)
  const [newTag, setNewTag] = useState('')

  const { status, scheduleSave, forceSave, getNoteId } = useAutoSave({
    userId,
    sessionId,
    onSave: (note) => {
      console.log('Note auto-saved:', note.id)
      if (onSaved) {
        onSaved(note.id)
      }
    },
    onError: (error) => {
      console.error('Auto-save error:', error)
      // Could show a toast notification here
    },
  })

  // Auto-save when content changes
  useEffect(() => {
    // Only schedule save if there's actual content
    if (title.trim() || content.trim()) {
      scheduleSave(title || 'Untitled Note', content, tags)
    }
  }, [title, content, tags, scheduleSave])

  const handleAddTag = useCallback(() => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()])
      setNewTag('')
    }
  }, [newTag, tags])

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove))
  }, [])

  const handleForceSave = useCallback(async () => {
    try {
      const note = await forceSave()
      if (note && onSaved) {
        onSaved(note.id)
      }
    } catch (error) {
      console.error('Force save failed:', error)
    }
  }, [forceSave, onSaved])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ctrl+S or Cmd+S to force save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      handleForceSave()
    }
  }, [handleForceSave])

  // Auto-save status indicator
  const SaveStatusIndicator = () => {
    if (status.isSaving) {
      return (
        <div className="flex items-center gap-2 text-blue-600">
          <Clock className="h-4 w-4 animate-spin" />
          <span className="text-sm">Saving...</span>
        </div>
      )
    }

    if (status.hasUnsavedChanges) {
      return (
        <div className="flex items-center gap-2 text-amber-600">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">Unsaved changes</span>
        </div>
      )
    }

    if (status.lastSaved) {
      const timeSinceLastSave = Date.now() - status.lastSaved.getTime()
      const minutes = Math.floor(timeSinceLastSave / 60000)
      const seconds = Math.floor((timeSinceLastSave % 60000) / 1000)
      
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">
            Saved {minutes > 0 ? `${minutes}m ago` : `${seconds}s ago`}
          </span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 text-gray-500">
        <span className="text-sm">No changes yet</span>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col" onKeyDown={handleKeyDown}>
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {noteId ? 'Edit Note' : 'Create Note'}
            </CardTitle>
            <div className="flex items-center gap-3">
              <SaveStatusIndicator />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleForceSave}
                disabled={status.isSaving || (!status.hasUnsavedChanges && !title && !content)}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Now
              </Button>
              {onClose && (
                <Button variant="outline" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col space-y-4">
          {/* Title */}
          <div>
            <Input
              placeholder="Enter note title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-medium border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="Add tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTag()
                  }
                }}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAddTag}
                disabled={!newTag.trim() || tags.includes(newTag.trim())}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <Textarea
              placeholder="Start writing your note..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="h-full min-h-[300px] resize-none border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          
          {/* Error Display */}
          {status.saveError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Save Failed</span>
              </div>
              <p className="text-sm text-destructive/80 mt-1">
                {status.saveError.message}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-100 rounded-md text-xs text-gray-600">
          <div>Session ID: {sessionId}</div>
          <div>Note ID: {getNoteId() || 'Not saved yet'}</div>
          <div>Has unsaved: {status.hasUnsavedChanges.toString()}</div>
          <div>Is saving: {status.isSaving.toString()}</div>
        </div>
      )}
    </div>
  )
}