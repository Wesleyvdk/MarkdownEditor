import { db } from '../database/connection'
import { notes, noteLinks, type Note, type NewNote, type NewNoteLink, type NoteLink } from '../database/schema'
import { r2Storage } from './storage'
import { eq, and, desc, asc, or, ilike, inArray, sql } from 'drizzle-orm'
import crypto from 'crypto'

export interface NoteWithLinks {
  note: Note
  outgoingLinks: NoteLink[]
  incomingLinks: NoteLink[]
}

export interface CreateNoteRequest {
  title: string
  content: string
  tags?: string[]
  workspaceId?: string
}

export interface UpdateNoteRequest {
  title?: string
  content?: string
  tags?: string[]
}

export interface SearchOptions {
  query?: string
  tags?: string[]
  limit?: number
  offset?: number
  sortBy?: 'updated_at' | 'created_at' | 'title'
  sortOrder?: 'asc' | 'desc'
}

export class NotesService {
  // Keep track of active auto-save operations to prevent conflicts
  private activeAutoSaves = new Set<string>()
  async createNote(userId: string, data: CreateNoteRequest): Promise<Note> {
    const noteId = crypto.randomUUID()
    
    try {
      // Upload content to R2
      const { objectKey, contentHash, size } = await r2Storage.uploadNote(userId, noteId, data.content)
      
      // Insert note record into database
      const [newNote] = await db.insert(notes).values({
        id: noteId,
        userId,
        title: data.title,
        contentHash,
        r2ObjectKey: objectKey,
        fileSize: size,
        tags: data.tags || [],
      }).returning()

      // Extract and create note links
      await this.updateNoteLinks(newNote.id, data.content)

      return newNote
    } catch (error) {
      // Clean up R2 upload if database insert fails
      const objectKey = r2Storage.generateObjectKey(userId, noteId)
      try {
        await r2Storage.deleteNote(objectKey)
      } catch (cleanupError) {
        console.error('Failed to cleanup R2 object after database error:', cleanupError)
      }
      throw error
    }
  }

  async updateNote(userId: string, noteId: string, data: UpdateNoteRequest): Promise<Note> {
    // First verify the note belongs to the user
    const existingNote = await this.getNoteById(userId, noteId)
    if (!existingNote) {
      throw new Error('Note not found')
    }

    let updateData: Partial<NewNote> = {}
    
    if (data.title !== undefined) {
      updateData.title = data.title
    }
    
    if (data.tags !== undefined) {
      updateData.tags = data.tags
    }

    // Handle content update
    if (data.content !== undefined) {
      const newContentHash = r2Storage.generateContentHash(data.content)
      
      // Only upload if content has changed
      if (newContentHash !== existingNote.contentHash) {
        const { objectKey, contentHash, size } = await r2Storage.uploadNote(userId, noteId, data.content)
        updateData.contentHash = contentHash
        updateData.r2ObjectKey = objectKey
        updateData.fileSize = size

        // Update note links
        await this.updateNoteLinks(noteId, data.content)
      }
    }

    if (Object.keys(updateData).length === 0) {
      return existingNote
    }

    updateData.updatedAt = new Date()

    const [updatedNote] = await db
      .update(notes)
      .set(updateData)
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
      .returning()

    return updatedNote
  }

  /**
   * Auto-save optimized update - handles concurrent saves gracefully
   */
  async autoSaveNote(userId: string, noteId: string | null, data: UpdateNoteRequest): Promise<Note> {
    const saveKey = `${userId}:${noteId || 'new'}`
    
    // Prevent concurrent auto-saves for the same note
    if (this.activeAutoSaves.has(saveKey)) {
      throw new Error('Auto-save already in progress for this note')
    }

    this.activeAutoSaves.add(saveKey)
    
    try {
      if (noteId) {
        return await this.updateNote(userId, noteId, data)
      } else {
        return await this.createNote(userId, {
          title: data.title || 'Untitled Note',
          content: data.content || '',
          tags: data.tags || [],
        })
      }
    } finally {
      this.activeAutoSaves.delete(saveKey)
    }
  }

  /**
   * Check if an auto-save is currently in progress
   */
  isAutoSaveInProgress(userId: string, noteId: string | null): boolean {
    const saveKey = `${userId}:${noteId || 'new'}`
    return this.activeAutoSaves.has(saveKey)
  }

  async getNoteById(userId: string, noteId: string): Promise<Note | null> {
    const [note] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId), eq(notes.isDeleted, false)))

    return note || null
  }

  async getNoteWithContent(userId: string, noteId: string): Promise<{ note: Note; content: string } | null> {
    const note = await this.getNoteById(userId, noteId)
    if (!note || !note.r2ObjectKey) {
      return null
    }

    try {
      const content = await r2Storage.downloadNote(note.r2ObjectKey)
      return { note, content }
    } catch (error) {
      console.error('Failed to download note content:', error)
      return null
    }
  }

  async getNoteWithLinks(userId: string, noteId: string): Promise<NoteWithLinks | null> {
    const note = await this.getNoteById(userId, noteId)
    if (!note) {
      return null
    }

    const [outgoingLinks, incomingLinks] = await Promise.all([
      db.select().from(noteLinks).where(eq(noteLinks.sourceNoteId, noteId)),
      db.select().from(noteLinks).where(eq(noteLinks.targetNoteId, noteId)),
    ])

    return {
      note,
      outgoingLinks,
      incomingLinks,
    }
  }

  async searchNotes(userId: string, options: SearchOptions = {}): Promise<{ notes: Note[]; total: number }> {
    const {
      query,
      tags,
      limit = 50,
      offset = 0,
      sortBy = 'updated_at',
      sortOrder = 'desc',
    } = options

    let whereConditions = [eq(notes.userId, userId), eq(notes.isDeleted, false)]

    // Text search
    if (query) {
      whereConditions.push(
        or(
          ilike(notes.title, `%${query}%`),
          sql`${notes.tags} && ARRAY[${query}]::text[]`
        )!
      )
    }

    // Tag filter
    if (tags && tags.length > 0) {
      whereConditions.push(sql`${notes.tags} && ARRAY[${tags.join(',')}]::text[]`)
    }

    const baseQuery = db
      .select()
      .from(notes)
      .where(and(...whereConditions))

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notes)
      .where(and(...whereConditions))

    // Get paginated results
    const orderColumn = sortBy === 'title' ? notes.title : 
                       sortBy === 'created_at' ? notes.createdAt : notes.updatedAt
    const orderDirection = sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn)

    const results = await baseQuery
      .orderBy(orderDirection)
      .limit(limit)
      .offset(offset)

    return {
      notes: results,
      total: count,
    }
  }

  async getUserNotes(userId: string, limit = 50, offset = 0): Promise<Note[]> {
    return await db
      .select()
      .from(notes)
      .where(and(eq(notes.userId, userId), eq(notes.isDeleted, false)))
      .orderBy(desc(notes.updatedAt))
      .limit(limit)
      .offset(offset)
  }

  async deleteNote(userId: string, noteId: string): Promise<boolean> {
    const note = await this.getNoteById(userId, noteId)
    if (!note) {
      return false
    }

    try {
      // Soft delete in database
      await db
        .update(notes)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))

      // Optionally delete from R2 (or keep for recovery)
      if (note.r2ObjectKey) {
        await r2Storage.deleteNote(note.r2ObjectKey)
      }

      return true
    } catch (error) {
      console.error('Failed to delete note:', error)
      return false
    }
  }

  async permanentlyDeleteNote(userId: string, noteId: string): Promise<boolean> {
    const note = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
      .then(results => results[0])

    if (!note) {
      return false
    }

    try {
      // Delete from database (cascades to links and embeddings)
      await db.delete(notes).where(and(eq(notes.id, noteId), eq(notes.userId, userId)))

      // Delete from R2
      if (note.r2ObjectKey) {
        await r2Storage.deleteNote(note.r2ObjectKey)
      }

      return true
    } catch (error) {
      console.error('Failed to permanently delete note:', error)
      return false
    }
  }

  private async updateNoteLinks(noteId: string, content: string): Promise<void> {
    // Delete existing links for this note
    await db.delete(noteLinks).where(eq(noteLinks.sourceNoteId, noteId))

    // Extract all [[link]] patterns from content
    const linkPattern = /\[\[([^\]]+)\]\]/g
    const matches = Array.from(content.matchAll(linkPattern))
    
    if (matches.length === 0) {
      return
    }

    // Find which linked notes actually exist
    const linkTexts = matches.map(match => match[1])
    const existingNotes = await db
      .select({ id: notes.id, title: notes.title })
      .from(notes)
      .where(inArray(notes.title, linkTexts))

    // Create note links
    const linksToInsert: NewNoteLink[] = []
    
    for (const match of matches) {
      const linkText = match[1]
      const targetNote = existingNotes.find(note => 
        note.title.toLowerCase() === linkText.toLowerCase()
      )

      linksToInsert.push({
        sourceNoteId: noteId,
        targetNoteId: targetNote?.id || null,
        linkText,
        isBroken: !targetNote,
      })
    }

    if (linksToInsert.length > 0) {
      await db.insert(noteLinks).values(linksToInsert)
    }
  }

  async getOrphanedNotes(userId: string): Promise<Note[]> {
    // Notes with no incoming links
    const orphanedQuery = db
      .select()
      .from(notes)
      .leftJoin(noteLinks, eq(notes.id, noteLinks.targetNoteId))
      .where(
        and(
          eq(notes.userId, userId),
          eq(notes.isDeleted, false),
          sql`${noteLinks.targetNoteId} IS NULL`
        )
      )

    const results = await orphanedQuery
    return results.map(r => r.notes)
  }

  async getBrokenLinks(userId: string): Promise<NoteLink[]> {
    return await db
      .select()
      .from(noteLinks)
      .innerJoin(notes, eq(noteLinks.sourceNoteId, notes.id))
      .where(
        and(
          eq(notes.userId, userId),
          eq(noteLinks.isBroken, true)
        )
      )
      .then(results => results.map(r => r.note_links))
  }

  async updateLastAccessed(userId: string, noteId: string): Promise<void> {
    await db
      .update(notes)
      .set({ lastAccessedAt: new Date() })
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
  }

  /**
   * Batch operations for handling multiple notes efficiently
   */
  async batchUpdateLastAccessed(userId: string, noteIds: string[]): Promise<void> {
    if (noteIds.length === 0) return
    
    await db
      .update(notes)
      .set({ lastAccessedAt: new Date() })
      .where(
        and(
          eq(notes.userId, userId),
          inArray(notes.id, noteIds)
        )
      )
  }

  /**
   * Get notes that need cleanup (haven't been accessed in X days)
   */
  async getStaleNotes(userId: string, daysStale = 30): Promise<Note[]> {
    const staleDate = new Date()
    staleDate.setDate(staleDate.getDate() - daysStale)
    
    return await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.userId, userId),
          eq(notes.isDeleted, false),
          sql`${notes.lastAccessedAt} < ${staleDate}`
        )
      )
      .limit(100) // Limit for performance
  }

  /**
   * Optimized search for auto-complete (note titles only)
   */
  async searchNoteTitles(userId: string, query: string, limit = 10): Promise<Pick<Note, 'id' | 'title'>[]> {
    return await db
      .select({
        id: notes.id,
        title: notes.title,
      })
      .from(notes)
      .where(
        and(
          eq(notes.userId, userId),
          eq(notes.isDeleted, false),
          ilike(notes.title, `%${query}%`)
        )
      )
      .orderBy(desc(notes.lastAccessedAt))
      .limit(limit)
  }
}

export const notesService = new NotesService()

// Helper function for generating session IDs
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Helper function for sanitizing note titles for file systems
export function sanitizeNoteTitle(title: string): string {
  return title
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid file system characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim()
    .slice(0, 200) // Limit length
    || 'Untitled Note' // Fallback
}