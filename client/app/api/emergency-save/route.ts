import { NextRequest, NextResponse } from 'next/server'
import { notesService } from '@/app/lib/notes-service'
import { authService } from '@/app/lib/auth-service'

interface EmergencySaveRequest {
  sessionId: string
  noteId?: string
  title: string
  content: string
  tags: string[]
  userId: string
}

export async function POST(request: NextRequest) {
  try {
    // Parse the emergency save data
    const data: EmergencySaveRequest = await request.json()
    
    // Validate required fields
    if (!data.userId || !data.title || data.content === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify user authentication (simplified - you may want more robust auth)
    // In a real app, you'd validate the user session/token
    
    try {
      let note
      
      if (data.noteId) {
        // Update existing note
        note = await notesService.updateNote(data.userId, data.noteId, {
          title: data.title,
          content: data.content,
          tags: data.tags,
        })
      } else {
        // Create new note
        note = await notesService.createNote(data.userId, {
          title: data.title,
          content: data.content,
          tags: data.tags,
        })
      }

      return NextResponse.json({ 
        success: true, 
        noteId: note.id,
        message: 'Emergency save completed'
      })

    } catch (dbError) {
      console.error('Emergency save database error:', dbError)
      
      // For emergency saves, we might want to store in a temporary location
      // if the main database is failing
      return NextResponse.json(
        { 
          error: 'Database error during emergency save',
          sessionId: data.sessionId,
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Emergency save error:', error)
    
    return NextResponse.json(
      { error: 'Emergency save failed' },
      { status: 500 }
    )
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}