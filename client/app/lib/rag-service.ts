// RAG (Retrieval Augmented Generation) Service
// Handles document indexing, similarity search, and context retrieval

interface Note {
  id: string
  title: string
  content: string
  tags?: string[]
  lastModified?: string
}

interface RAGChunk {
  id: string
  noteId: string
  noteTitle: string
  content: string
  startIndex: number
  endIndex: number
  embedding?: number[]
}

interface RAGResult {
  chunk: RAGChunk
  similarity: number
  relevanceScore: number
}

interface RAGConfig {
  chunkSize: number
  chunkOverlap: number
  maxResults: number
  minSimilarity: number
}

class RAGService {
  private chunks: RAGChunk[] = []
  private config: RAGConfig = {
    chunkSize: 1000,
    chunkOverlap: 200,
    maxResults: 5,
    minSimilarity: 0.3,
  }

  constructor(config?: Partial<RAGConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
  }

  // Index all notes for RAG retrieval
  async indexNotes(notes: Note[]): Promise<void> {
    this.chunks = []

    for (const note of notes) {
      const noteChunks = this.chunkDocument(note)
      this.chunks.push(...noteChunks)
    }

    // In a real implementation, you would generate embeddings here
    // For now, we'll use text-based similarity
    console.log(`[RAG] Indexed ${this.chunks.length} chunks from ${notes.length} notes`)
  }

  // Split a document into overlapping chunks
  private chunkDocument(note: Note): RAGChunk[] {
    const chunks: RAGChunk[] = []
    const content = note.content
    const { chunkSize, chunkOverlap } = this.config

    // Split by paragraphs first, then by sentences if needed
    const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim().length > 0)
    let currentChunk = ""
    let startIndex = 0

    for (const paragraph of paragraphs) {
      // If adding this paragraph would exceed chunk size, save current chunk
      if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
        chunks.push({
          id: `${note.id}-${chunks.length}`,
          noteId: note.id,
          noteTitle: note.title,
          content: currentChunk.trim(),
          startIndex,
          endIndex: startIndex + currentChunk.length,
        })

        // Start new chunk with overlap
        const overlapText = this.getOverlapText(currentChunk, chunkOverlap)
        currentChunk = overlapText + paragraph
        startIndex = startIndex + currentChunk.length - overlapText.length
      } else {
        currentChunk += (currentChunk ? "\n\n" : "") + paragraph
      }
    }

    // Add the last chunk if it has content
    if (currentChunk.trim().length > 0) {
      chunks.push({
        id: `${note.id}-${chunks.length}`,
        noteId: note.id,
        noteTitle: note.title,
        content: currentChunk.trim(),
        startIndex,
        endIndex: startIndex + currentChunk.length,
      })
    }

    return chunks
  }

  // Get overlap text from the end of a chunk
  private getOverlapText(text: string, overlapSize: number): string {
    if (text.length <= overlapSize) return text

    // Try to break at sentence boundaries
    const sentences = text.split(/[.!?]+/)
    let overlap = ""

    for (let i = sentences.length - 1; i >= 0; i--) {
      const candidate = sentences.slice(i).join(". ")
      if (candidate.length <= overlapSize) {
        overlap = candidate
        break
      }
    }

    return overlap || text.slice(-overlapSize)
  }

  // Retrieve relevant chunks for a query
  async retrieveRelevantChunks(query: string, excludeNoteIds: string[] = []): Promise<RAGResult[]> {
    const queryTerms = this.extractKeyTerms(query.toLowerCase())
    const results: RAGResult[] = []

    for (const chunk of this.chunks) {
      // Skip chunks from excluded notes
      if (excludeNoteIds.includes(chunk.noteId)) continue

      const similarity = this.calculateSimilarity(queryTerms, chunk.content.toLowerCase())
      const relevanceScore = this.calculateRelevanceScore(chunk, query, similarity)

      if (similarity >= this.config.minSimilarity) {
        results.push({
          chunk,
          similarity,
          relevanceScore,
        })
      }
    }

    // Sort by relevance score and return top results
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, this.config.maxResults)
  }

  // Extract key terms from query (simple implementation)
  private extractKeyTerms(text: string): string[] {
    // Remove common stop words and extract meaningful terms
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "can",
      "this",
      "that",
      "these",
      "those",
    ])

    return text
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((term) => term.length > 2 && !stopWords.has(term))
      .slice(0, 20) // Limit to top 20 terms
  }

  // Calculate text similarity using term overlap (simple implementation)
  private calculateSimilarity(queryTerms: string[], content: string): number {
    const contentTerms = this.extractKeyTerms(content)
    const contentTermSet = new Set(contentTerms)

    let matches = 0
    for (const term of queryTerms) {
      if (contentTermSet.has(term)) {
        matches++
      }
    }

    return queryTerms.length > 0 ? matches / queryTerms.length : 0
  }

  // Calculate overall relevance score
  private calculateRelevanceScore(chunk: RAGChunk, query: string, similarity: number): number {
    let score = similarity

    // Boost score for title matches
    const queryLower = query.toLowerCase()
    const titleLower = chunk.noteTitle.toLowerCase()
    if (titleLower.includes(queryLower) || queryLower.includes(titleLower)) {
      score += 0.3
    }

    // Boost score for exact phrase matches
    if (chunk.content.toLowerCase().includes(queryLower)) {
      score += 0.2
    }

    // Boost score for shorter, more focused chunks
    const lengthPenalty = Math.min(chunk.content.length / 2000, 0.2)
    score -= lengthPenalty

    return Math.min(score, 1.0)
  }

  // Generate context string from retrieved chunks
  generateContext(results: RAGResult[]): string {
    if (results.length === 0) return ""

    const contextParts = results.map((result, index) => {
      const { chunk } = result
      return `## Context ${index + 1}: ${chunk.noteTitle}\n\n${chunk.content}`
    })

    return contextParts.join("\n\n---\n\n")
  }

  // Get configuration
  getConfig(): RAGConfig {
    return { ...this.config }
  }

  // Update configuration
  updateConfig(newConfig: Partial<RAGConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  // Get statistics
  getStats() {
    return {
      totalChunks: this.chunks.length,
      averageChunkSize:
        this.chunks.length > 0
          ? Math.round(this.chunks.reduce((sum, chunk) => sum + chunk.content.length, 0) / this.chunks.length)
          : 0,
      config: this.config,
    }
  }
}

// Singleton instance
export const ragService = new RAGService()

// Helper functions for RAG operations
export async function initializeRAG(notes: Note[]): Promise<void> {
  await ragService.indexNotes(notes)
}

export async function searchRelevantContent(query: string, excludeNoteIds: string[] = []): Promise<RAGResult[]> {
  return ragService.retrieveRelevantChunks(query, excludeNoteIds)
}

export function generateRAGContext(results: RAGResult[]): string {
  return ragService.generateContext(results)
}

export function getRAGStats() {
  return ragService.getStats()
}

export type { Note, RAGChunk, RAGResult, RAGConfig }
