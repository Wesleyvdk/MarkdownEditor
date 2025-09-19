import { FastifyPluginAsync } from 'fastify'
import { notesService } from '../../lib/notes-service'
import { z } from 'zod'

const emergencySaveSchema = z.object({
  sessionId: z.string(),
  noteId: z.string().optional(),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  userId: z.string()
})

const emergencySave: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post('/', async function (request, reply) {
    try {
      // Parse the emergency save data
      const data = emergencySaveSchema.parse(request.body)

      // Validate required fields
      if (!data.userId || !data.title || data.content === undefined) {
        return reply.code(400).send({
          error: 'Missing required fields'
        })
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

        return {
          success: true,
          noteId: note.id,
          message: 'Emergency save completed'
        }

      } catch (dbError) {
        fastify.log.error(dbError, 'Emergency save database error')

        // For emergency saves, we might want to store in a temporary location
        // if the main database is failing
        return reply.code(500).send({
          error: 'Database error during emergency save',
          sessionId: data.sessionId,
        })
      }

    } catch (error) {
      fastify.log.error(error, 'Emergency save error')

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Invalid request format',
          details: error.issues
        })
      }

      return reply.code(500).send({
        error: 'Emergency save failed'
      })
    }
  })

  // CORS is handled globally by the CORS plugin
}

export default emergencySave