import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import crypto from 'crypto'

export class R2StorageService {
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
    const contentHash = this.generateContentHash(content)
    const buffer = Buffer.from(content, 'utf8')

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
      Body: buffer,
      ContentType: 'text/markdown',
      Metadata: {
        userId,
        noteId,
        contentHash,
        uploadedAt: new Date().toISOString(),
      },
    })

    await this.client.send(command)

    return {
      objectKey,
      contentHash,
      size: buffer.length,
    }
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
}

export const r2Storage = new R2StorageService()