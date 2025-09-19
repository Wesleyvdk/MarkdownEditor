import { FastifyPluginAsync } from 'fastify'
import { notesService } from '../../lib/notes-service'
import { z } from 'zod'

const syncRequestSchema = z.object({
  sessionId: z.string(),
  noteId: z.string().optional(),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  userId: z.string(),
  timestamp: z.number()
})

const createNoteSchema = z.object({
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  userId: z.string()
})

const updateNoteSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional()
})

const notes: FastifyPluginAsync = async (fastify): Promise<void> => {
  // CREATE: POST /api/notes
  fastify.post('/', async function (request, reply) {
    try {
      const data = createNoteSchema.parse(request.body)

      const note = await notesService.createNote(data.userId, {
        title: data.title,
        content: data.content,
        tags: data.tags,
      })

      return {
        success: true,
        note: note
      }
    } catch (error) {
      fastify.log.error(error, 'Create note error')

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Invalid request format',
          details: error.issues
        })
      }

      return reply.code(500).send({
        error: 'Failed to create note'
      })
    }
  })

  // READ: GET /api/notes/:id
  fastify.get('/:id', async function (request, reply) {
    try {
      const { id } = request.params as { id: string }
      const userId = request.query as { userId?: string }

      if (!userId.userId) {
        return reply.code(400).send({
          error: 'userId query parameter is required'
        })
      }

      const noteWithContent = await notesService.getNoteWithContent(userId.userId, id)

      if (!noteWithContent) {
        return reply.code(404).send({
          error: 'Note not found'
        })
      }

      return {
        success: true,
        note: noteWithContent.note,
        content: noteWithContent.content
      }
    } catch (error) {
      fastify.log.error(error, 'Get note error')

      return reply.code(500).send({
        error: 'Failed to get note'
      })
    }
  })

  // UPDATE: PUT /api/notes/:id
  fastify.put('/:id', async function (request, reply) {
    try {
      const { id } = request.params as { id: string }
      const userId = request.query as { userId?: string }

      if (!userId.userId) {
        return reply.code(400).send({
          error: 'userId query parameter is required'
        })
      }

      const data = updateNoteSchema.parse(request.body)

      const note = await notesService.updateNote(userId.userId, id, data)

      return {
        success: true,
        note: note
      }
    } catch (error) {
      fastify.log.error(error, 'Update note error')

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Invalid request format',
          details: error.issues
        })
      }

      return reply.code(500).send({
        error: 'Failed to update note'
      })
    }
  })

  // SYNC: POST /api/notes (alternative endpoint for offline sync)
  fastify.post('/sync', async function (request, reply) {
    try {
      const data = syncRequestSchema.parse(request.body)

      // Validate required fields
      if (!data.userId || !data.title || data.content === undefined) {
        return reply.code(400).send({
          error: 'Missing required fields'
        })
      }

      // Additional validation
      if (!data.sessionId || !data.timestamp) {
        return reply.code(400).send({
          error: 'Invalid sync request'
        })
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
            fastify.log.info(`Note ${data.noteId} not found for update, creating new note`)
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

        return {
          success: true,
          noteId: note.id,
          sessionId: data.sessionId,
          syncedAt: new Date().toISOString(),
          message: 'Note synced successfully'
        }

      } catch (dbError) {
        fastify.log.error(dbError, 'Sync database error')

        return reply.code(500).send({
          error: 'Failed to sync note to database',
          sessionId: data.sessionId,
          retryable: true
        })
      }

    } catch (parseError) {
      fastify.log.error(parseError, 'Sync request parse error')

      if (parseError instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Invalid request format',
          details: parseError.issues
        })
      }

      return reply.code(400).send({
        error: 'Invalid request format'
      })
    }
  })

  // CORS is handled globally by the CORS plugin
}

export default notes