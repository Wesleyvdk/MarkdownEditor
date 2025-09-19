import { pgTable, uuid, varchar, text, jsonb, timestamp, boolean, bigint, integer, decimal, primaryKey, unique, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
// Users table
export const users = pgTable('users', {
    id: uuid('id').primaryKey().default(sql `gen_random_uuid()`),
    email: varchar('email', { length: 255 }).notNull().unique(),
    username: varchar('username', { length: 100 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    displayName: varchar('display_name', { length: 255 }),
    avatarUrl: text('avatar_url'),
    settings: jsonb('settings').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
});
// Notes table
export const notes = pgTable('notes', {
    id: uuid('id').primaryKey().default(sql `gen_random_uuid()`),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 500 }).notNull(),
    contentHash: varchar('content_hash', { length: 64 }),
    r2ObjectKey: varchar('r2_object_key', { length: 1000 }),
    fileSize: bigint('file_size', { mode: 'number' }).default(0),
    tags: text('tags').array().default(sql `'{}'::text[]`),
    isDeleted: boolean('is_deleted').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    userIdIdx: index('idx_notes_user_id').on(table.userId),
    updatedAtIdx: index('idx_notes_updated_at').on(table.updatedAt),
    tagsIdx: index('idx_notes_tags').using('gin', table.tags),
}));
// Note links for bidirectional linking
export const noteLinks = pgTable('note_links', {
    id: uuid('id').primaryKey().default(sql `gen_random_uuid()`),
    sourceNoteId: uuid('source_note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
    targetNoteId: uuid('target_note_id').references(() => notes.id, { onDelete: 'cascade' }),
    linkText: varchar('link_text', { length: 500 }).notNull(),
    isBroken: boolean('is_broken').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    uniqueLink: unique().on(table.sourceNoteId, table.targetNoteId, table.linkText),
    sourceIdx: index('idx_note_links_source').on(table.sourceNoteId),
    targetIdx: index('idx_note_links_target').on(table.targetNoteId),
}));
// AI sessions for tracking AI interactions
export const aiSessions = pgTable('ai_sessions', {
    id: uuid('id').primaryKey().default(sql `gen_random_uuid()`),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 50 }).notNull(),
    model: varchar('model', { length: 100 }).notNull(),
    prompt: text('prompt').notNull(),
    response: text('response'),
    contextNotes: uuid('context_notes').array().default(sql `'{}'::uuid[]`),
    tokenCount: integer('token_count'),
    temperature: decimal('temperature', { precision: 3, scale: 2 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => ({
    userIdIdx: index('idx_ai_sessions_user_id').on(table.userId),
    createdAtIdx: index('idx_ai_sessions_created_at').on(table.createdAt),
}));
// User AI configurations
export const userAiConfigs = pgTable('user_ai_configs', {
    id: uuid('id').primaryKey().default(sql `gen_random_uuid()`),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 50 }).notNull(),
    model: varchar('model', { length: 100 }).notNull(),
    apiKeyEncrypted: text('api_key_encrypted'),
    baseUrl: text('base_url'),
    temperature: decimal('temperature', { precision: 3, scale: 2 }).default('0.7'),
    maxTokens: integer('max_tokens').default(2048),
    isDefault: boolean('is_default').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    uniqueConfig: unique().on(table.userId, table.provider, table.model),
}));
// RAG embeddings for semantic search
export const noteEmbeddings = pgTable('note_embeddings', {
    id: uuid('id').primaryKey().default(sql `gen_random_uuid()`),
    noteId: uuid('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
    chunkIndex: integer('chunk_index').notNull(),
    chunkText: text('chunk_text').notNull(),
    embedding: text('embedding'), // Store as JSON string for now
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    uniqueChunk: unique().on(table.noteId, table.chunkIndex),
    noteIdIdx: index('idx_note_embeddings_note_id').on(table.noteId),
}));
// Workspaces for organizing notes
export const workspaces = pgTable('workspaces', {
    id: uuid('id').primaryKey().default(sql `gen_random_uuid()`),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    color: varchar('color', { length: 7 }), // Hex color
    isDefault: boolean('is_default').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
// Many-to-many relationship between notes and workspaces
export const workspaceNotes = pgTable('workspace_notes', {
    workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    noteId: uuid('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
    addedAt: timestamp('added_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    pk: primaryKey({ columns: [table.workspaceId, table.noteId] }),
}));
