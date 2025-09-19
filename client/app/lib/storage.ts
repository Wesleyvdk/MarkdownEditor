import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import crypto from 'crypto'

export class R2StorageService {
  // Keep track of upload operations to prevent conflicts
  private activeUploads = new Map<string, Promise<any>>()
  private client: S3Client
  private bucketName: string

  constructor() {
    this.bucketName = process.env.R2_BUCKET_NAME || 'obsidian-clone-notes'
    
    this.client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    })
  }

  generateObjectKey(userId: string, noteId: string): string {
    return `users/${userId}/notes/${noteId}.md`
  }

  generateContentHash(content: string): string {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex')
  }

  async uploadNote(userId: string, noteId: string, content: string): Promise<{ objectKey: string; contentHash: string; size: number }> {
    const objectKey = this.generateObjectKey(userId, noteId)
    const uploadKey = `${userId}:${noteId}`
    
    // Check if there's already an upload in progress for this note
    const existingUpload = this.activeUploads.get(uploadKey)
    if (existingUpload) {
      // Wait for the existing upload to complete and return its result
      return await existingUpload
    }

    const contentHash = this.generateContentHash(content)
    const buffer = Buffer.from(content, 'utf8')

    const uploadPromise = this.performUpload(objectKey, buffer, {
      userId,
      noteId,
      contentHash,
      uploadedAt: new Date().toISOString(),
    })

    // Track the upload
    this.activeUploads.set(uploadKey, uploadPromise)

    try {
      const result = await uploadPromise
      return {
        objectKey,
        contentHash,
        size: buffer.length,
      }
    } finally {
      // Clean up tracking
      this.activeUploads.delete(uploadKey)
    }
  }

  private async performUpload(objectKey: string, buffer: Buffer, metadata: Record<string, string>): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
      Body: buffer,
      ContentType: 'text/markdown',
      Metadata: metadata,
    })

    await this.client.send(command)
  }

  async downloadNote(objectKey: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
    })

    const response = await this.client.send(command)
    
    if (!response.Body) {
      throw new Error('Note content not found')
    }

    const content = await response.Body.transformToString('utf8')
    return content
  }

  async deleteNote(objectKey: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
    })

    await this.client.send(command)
  }

  async noteExists(objectKey: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
      })
      
      await this.client.send(command)
      return true
    } catch (error) {
      return false
    }
  }

  async generatePresignedUrl(objectKey: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
    })

    return await getSignedUrl(this.client, command, { expiresIn })
  }

  async getFileInfo(objectKey: string): Promise<{ size: number; lastModified?: Date; contentType?: string }> {
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
    })

    const response = await this.client.send(command)
    
    return {
      size: response.ContentLength || 0,
      lastModified: response.LastModified,
      contentType: response.ContentType,
    }
  }

  async listUserNotes(userId: string): Promise<string[]> {
    // Note: R2 doesn't support listing objects natively like S3
    // You'll need to implement this using pagination with ListObjectsV2Command
    // For now, this is a placeholder that would require additional implementation
    throw new Error('listUserNotes not implemented - use database queries instead')
  }

  /**
   * Upload with retry logic for better reliability
   */
  async uploadNoteWithRetry(
    userId: string,
    noteId: string,
    content: string,
    maxRetries = 3
  ): Promise<{ objectKey: string; contentHash: string; size: number }> {
    let lastError: Error

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.uploadNote(userId, noteId, content)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Upload failed')
        
        if (attempt === maxRetries) {
          break
        }

        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError!
  }

  /**
   * Check if upload is currently in progress
   */
  isUploadInProgress(userId: string, noteId: string): boolean {
    const uploadKey = `${userId}:${noteId}`
    return this.activeUploads.has(uploadKey)
  }

  /**
   * Create backup copy before overwriting
   */
  async createBackupBeforeUpload(userId: string, noteId: string): Promise<string | null> {
    const objectKey = this.generateObjectKey(userId, noteId)
    
    try {
      // Check if current version exists
      const exists = await this.noteExists(objectKey)
      if (!exists) {
        return null
      }

      // Create backup key with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupKey = `users/${userId}/backups/${noteId}_${timestamp}.md`

      // Download current content
      const currentContent = await this.downloadNote(objectKey)
      
      // Upload as backup
      const backupCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: backupKey,
        Body: Buffer.from(currentContent, 'utf8'),
        ContentType: 'text/markdown',
        Metadata: {
          userId,
          noteId,
          originalKey: objectKey,
          backupCreated: timestamp,
        },
      })

      await this.client.send(backupCommand)
      return backupKey

    } catch (error) {
      console.error('Failed to create backup:', error)
      return null
    }
  }

  /**
   * Batch upload for multiple notes (useful for bulk operations)
   */
  async batchUploadNotes(
    uploads: Array<{ userId: string; noteId: string; content: string }>
  ): Promise<Array<{ success: boolean; objectKey?: string; contentHash?: string; size?: number; error?: string }>> {
    const results = await Promise.allSettled(
      uploads.map(({ userId, noteId, content }) => 
        this.uploadNote(userId, noteId, content)
      )
    )

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return { success: true, ...result.value }
      } else {
        return {
          success: false,
          error: result.reason?.message || 'Unknown error'
        }
      }
    })
  }
}

export const r2Storage = new R2StorageService()

// Helper function to handle storage errors gracefully
export function handleStorageError(error: unknown, operation: string): Error {
  console.error(`Storage error during ${operation}:`, error)
  
  if (error instanceof Error) {
    // Add more context to the error
    return new Error(`${operation} failed: ${error.message}`)
  }
  
  return new Error(`${operation} failed: Unknown error`)
}