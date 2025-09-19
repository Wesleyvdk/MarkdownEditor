// Shared types for client-server communication
// These match the database schema but don't import database dependencies

export interface User {
  id: string
  email: string
  username: string
  passwordHash: string
  displayName: string | null
  avatarUrl: string | null
  settings: any
  createdAt: Date | null
  updatedAt: Date | null
  lastLoginAt: Date | null
}

export interface NewUser {
  id?: string
  email: string
  username: string
  passwordHash: string
  displayName?: string | null
  avatarUrl?: string | null
  settings?: any
  createdAt?: Date | null
  updatedAt?: Date | null
  lastLoginAt?: Date | null
}

export interface Note {
  id: string
  userId: string
  title: string
  contentHash: string | null
  r2ObjectKey: string | null
  fileSize: number | null
  tags: string[] | null
  isDeleted: boolean | null
  createdAt: Date | null
  updatedAt: Date | null
  lastAccessedAt: Date | null
}

export interface NewNote {
  id?: string
  userId: string
  title: string
  contentHash?: string | null
  r2ObjectKey?: string | null
  fileSize?: number | null
  tags?: string[] | null
  isDeleted?: boolean | null
  createdAt?: Date | null
  updatedAt?: Date | null
  lastAccessedAt?: Date | null
}

export interface NoteLink {
  id: string
  sourceNoteId: string
  targetNoteId: string | null
  linkText: string
  isBroken: boolean | null
  createdAt: Date | null
}

export interface NewNoteLink {
  id?: string
  sourceNoteId: string
  targetNoteId?: string | null
  linkText: string
  isBroken?: boolean | null
  createdAt?: Date | null
}

export interface AiSession {
  id: string
  userId: string
  provider: string
  model: string
  prompt: string
  response: string | null
  contextNotes: string[] | null
  tokenCount: number | null
  temperature: string | null
  createdAt: Date | null
  completedAt: Date | null
}

export interface NewAiSession {
  id?: string
  userId: string
  provider: string
  model: string
  prompt: string
  response?: string | null
  contextNotes?: string[] | null
  tokenCount?: number | null
  temperature?: string | null
  createdAt?: Date | null
  completedAt?: Date | null
}

export interface UserAiConfig {
  id: string
  userId: string
  provider: string
  model: string
  apiKeyEncrypted: string | null
  baseUrl: string | null
  temperature: string | null
  maxTokens: number | null
  isDefault: boolean | null
  createdAt: Date | null
  updatedAt: Date | null
}

export interface NewUserAiConfig {
  id?: string
  userId: string
  provider: string
  model: string
  apiKeyEncrypted?: string | null
  baseUrl?: string | null
  temperature?: string | null
  maxTokens?: number | null
  isDefault?: boolean | null
  createdAt?: Date | null
  updatedAt?: Date | null
}

export interface NoteEmbedding {
  id: string
  noteId: string
  chunkIndex: number
  chunkText: string
  embedding: string | null
  createdAt: Date | null
}

export interface NewNoteEmbedding {
  id?: string
  noteId: string
  chunkIndex: number
  chunkText: string
  embedding?: string | null
  createdAt?: Date | null
}

export interface Workspace {
  id: string
  userId: string
  name: string
  description: string | null
  color: string | null
  isDefault: boolean | null
  createdAt: Date | null
  updatedAt: Date | null
}

export interface NewWorkspace {
  id?: string
  userId: string
  name: string
  description?: string | null
  color?: string | null
  isDefault?: boolean | null
  createdAt?: Date | null
  updatedAt?: Date | null
}

export interface WorkspaceNote {
  workspaceId: string
  noteId: string
  addedAt: Date | null
}

export interface NewWorkspaceNote {
  workspaceId: string
  noteId: string
  addedAt?: Date | null
}