import { NextRequest, NextResponse } from 'next/server'
import { notesService } from '@/app/lib/notes-service'

interface SyncRequest {
  sessionId: string
  noteId?: string
  title: string
  content: string
  tags: string[]
  userId: string
  timestamp: number
}

export async function POST(request: NextRequest) {
  try {
    const data: SyncRequest = await request.json()
    
    // Validate required fields
    if (!data.userId || !data.title || data.content === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Additional validation
    if (!data.sessionId || !data.timestamp) {
      return NextResponse.json(
        { error: 'Invalid sync request' },
        { status: 400 }
      )
    }

    try {
      let note

      if (data.noteId) {
        // Try to update existing note
        try {
          note = await notesService.updateNote(data.userId, data.noteId, {
            title: data.title,
            content: data.content,
            tags: data.tags,
          })
        } catch (updateError) {
          // If update fails (note might have been deleted), create new note
          console.log(`Note ${data.noteId} not found for update, creating new note`)
          note = await notesService.createNote(data.userId, {
            title: data.title,
            content: data.content,
            tags: data.tags,
          })
        }
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
        sessionId: data.sessionId,
        syncedAt: new Date().toISOString(),
        message: 'Note synced successfully'
      })

    } catch (dbError) {
      console.error('Sync database error:', dbError)
      
      return NextResponse.json(
        { 
          error: 'Failed to sync note to database',
          sessionId: data.sessionId,
          retryable: true
        },
        { status: 500 }
      )
    }

  } catch (parseError) {
    console.error('Sync request parse error:', parseError)
    
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    )
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}