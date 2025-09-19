"use client"

import React, { useState, useEffect } from 'react'
import { NotesList } from './components/notes-list'
import { MarkdownEditor } from './components/markdown-editor'
import { NoteEditor } from './components/note-editor'
import { Sidebar } from './components/sidebar'
import { authService } from './lib/auth-service'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Button } from './components/ui/button'
import { FileText, Plus, BookOpen, Settings } from 'lucide-react'

type ViewMode = 'dashboard' | 'notes-list' | 'editor' | 'new-note'

interface AppState {
  currentView: ViewMode
  selectedNoteId?: string
  currentUser?: {
    userId: string
    email: string
    username: string
    displayName?: string
  }
}

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>({
    currentView: 'dashboard'
  })

  useEffect(() => {
    // Initialize user session
    const initAuth = async () => {
      try {
        const user = await authService.getCurrentUser()
        setAppState(prev => ({
          ...prev,
          currentUser: user
        }))
      } catch (error) {
        console.error('Failed to initialize auth:', error)
      }
    }

    initAuth()
  }, [])

  const handleNoteSelect = (noteId: string) => {
    setAppState(prev => ({
      ...prev,
      currentView: 'editor',
      selectedNoteId: noteId
    }))
  }

  const handleCreateNote = () => {
    console.log('handleCreateNote called')
    setAppState(prev => ({
      ...prev,
      currentView: 'new-note',
      selectedNoteId: undefined
    }))
  }

  const handleNoteSaved = (noteId: string) => {
    console.log('Note saved:', noteId)
    // Could refresh notes list or update UI here
  }

  const handleBackToList = () => {
    setAppState(prev => ({
      ...prev,
      currentView: 'notes-list'
    }))
  }

  const handleBackToDashboard = () => {
    console.log('handleBackToDashboard called')
    setAppState(prev => ({
      ...prev,
      currentView: 'dashboard'
    }))
  }

  // Dashboard view with overview cards
  const DashboardView = () => (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome back, {appState.currentUser?.displayName || 'User'}!
        </h1>
        <p className="text-muted-foreground">
          Your intelligent markdown editor with AI assistance and auto-save functionality.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleCreateNote}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="h-5 w-5 text-primary" />
              Create New Note
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Start writing with our AI-powered markdown editor. Auto-saves every 7 seconds.
            </p>
            <Button className="mt-4 w-full">
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setAppState(prev => ({ ...prev, currentView: 'notes-list' }))}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-blue-600" />
              Browse Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View, search, and organize all your notes. Supports tags and bidirectional links.
            </p>
            <Button variant="outline" className="mt-4 w-full">
              <BookOpen className="h-4 w-4 mr-2" />
              View All Notes
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-green-600" />
              AI Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configure your AI providers, models, and preferences for content generation.
            </p>
            <Button variant="outline" className="mt-4 w-full">
              <Settings className="h-4 w-4 mr-2" />
              Configure AI
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="bg-muted/30 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-3">Quick Start</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• <strong>Auto-save:</strong> Your notes save automatically every 7 seconds</p>
          <p>• <strong>AI Chat:</strong> Click the chat icon to get AI assistance</p>
          <p>• <strong>Pre-written prompts:</strong> Use templates like "Write a document about..." or "Create a design document"</p>
          <p>• <strong>Offline support:</strong> Notes are saved locally when offline and synced when back online</p>
          <p>• <strong>Linking:</strong> Use [[note title]] to link between notes</p>
        </div>
      </div>
    </div>
  )

  if (!appState.currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing app...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 border-r border-border">
          <Sidebar 
            onCreateNote={handleCreateNote}
            onViewNotes={() => {
              console.log('onViewNotes called')
              setAppState(prev => ({ ...prev, currentView: 'notes-list' }))
            }}
            onDashboard={handleBackToDashboard}
            onNoteSelect={handleNoteSelect}
            currentView={appState.currentView}
            user={appState.currentUser}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {appState.currentView === 'dashboard' && <DashboardView />}
          
          {appState.currentView === 'notes-list' && (
            <NotesList 
              onNoteSelect={handleNoteSelect}
              onCreateNote={handleCreateNote}
            />
          )}
          
          {appState.currentView === 'editor' && appState.selectedNoteId && appState.currentUser && (
            <MarkdownEditor
              noteId={appState.selectedNoteId}
              userId={appState.currentUser.userId}
              onSaved={handleNoteSaved}
            />
          )}
          
          {appState.currentView === 'new-note' && appState.currentUser && (
            <NoteEditor
              userId={appState.currentUser.userId}
              onSaved={(noteId) => {
                handleNoteSaved(noteId)
                // Switch to editor view with the new note
                setAppState(prev => ({
                  ...prev,
                  currentView: 'editor',
                  selectedNoteId: noteId
                }))
              }}
              onClose={handleBackToList}
            />
          )}
        </div>
      </div>
    </div>
  )
}