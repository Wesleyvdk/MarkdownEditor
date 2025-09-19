# Database Architecture for Obsidian Clone

This document outlines the complete database solution implemented for the Obsidian Clone application.

## Overview

The application uses a hybrid architecture combining:
- **PostgreSQL**: Metadata, user management, relationships, and search
- **Cloudflare R2**: Markdown file storage (S3-compatible)
- **Drizzle ORM**: Type-safe database operations

## Architecture Benefits

### Why PostgreSQL + R2?

1. **Scalability**: Store large markdown files in R2 while keeping metadata in PostgreSQL
2. **Performance**: Fast queries for metadata, lazy loading of content
3. **Cost-Effective**: R2 provides cheaper storage than database BLOBs
4. **Flexibility**: Separate concerns between structured data and file storage
5. **Backup & Recovery**: Different strategies for metadata vs. content

### Database Schema

#### Core Tables

1. **users** - User authentication and profiles
2. **notes** - Note metadata with R2 object keys
3. **note_links** - Bidirectional linking between notes
4. **workspaces** - Note organization
5. **ai_sessions** - Track AI interactions
6. **user_ai_configs** - User AI provider settings
7. **note_embeddings** - RAG embeddings for semantic search

#### Key Features

- **Row Level Security (RLS)**: Ensures users can only access their own data
- **Full-text Search**: Built-in PostgreSQL search with tsvector
- **Automatic Timestamps**: Trigger-based updated_at columns
- **Referential Integrity**: Foreign keys with cascading deletes
- **Indexing**: Optimized for common query patterns

## File Storage Strategy

### R2 Object Structure
```
users/{userId}/notes/{noteId}.md
```

### Content Handling
1. **Upload**: Content → R2, metadata → PostgreSQL
2. **Read**: Metadata from PostgreSQL, content from R2 (lazy)
3. **Update**: New R2 object, updated metadata
4. **Delete**: Soft delete in PostgreSQL, optional R2 cleanup

### Hash-based Change Detection
- SHA-256 content hashes prevent unnecessary uploads
- Version control capabilities
- Integrity verification

## Services Architecture

### NotesService
- CRUD operations for notes
- Bidirectional link management
- Search and filtering
- Content synchronization

### AuthService
- User registration/login
- JWT token management
- Password hashing (bcrypt)
- Profile management

### R2StorageService
- File upload/download
- Presigned URLs
- Metadata handling
- Error recovery

## Setup Instructions

### 1. Environment Variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 2. Database Setup
```bash
# Install dependencies
npm install

# Generate migration files
npm run db:generate

# Run migrations
npm run db:migrate

# Optional: Open Drizzle Studio
npm run db:studio
```

### 3. Cloudflare R2 Setup
1. Create R2 bucket in Cloudflare dashboard
2. Generate API tokens with R2 permissions
3. Configure environment variables

### 4. PostgreSQL Setup
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create database
CREATE DATABASE obsidian_clone;
```

## Migration Strategy

### From Local Storage
1. **Data Export**: Extract notes from current local storage
2. **User Migration**: Create user accounts for existing data
3. **Bulk Import**: Use NotesService.createNote() for each note
4. **Link Reconstruction**: Parse [[links]] and rebuild relationships

### Example Migration Script
```typescript
import { notesService } from './app/lib/notes-service'

async function migrateLocalNotes(userId: string, localNotes: any[]) {
  for (const localNote of localNotes) {
    await notesService.createNote(userId, {
      title: localNote.title,
      content: localNote.content,
      tags: localNote.tags || []
    })
  }
}
```

## Security Considerations

### Database Security
- RLS policies ensure data isolation
- Parameterized queries prevent SQL injection
- Encrypted API keys in user_ai_configs
- Password hashing with bcrypt (12 rounds)

### Storage Security
- Presigned URLs for secure access
- User-scoped object keys
- Content integrity via hashes
- CORS configuration for browser access

## Performance Optimizations

### Database
- Composite indexes for common queries
- GIN indexes for array and full-text search
- Connection pooling
- Query optimization with EXPLAIN

### Storage
- Lazy content loading
- Content compression
- CDN caching (Cloudflare)
- Batch operations

## Monitoring & Maintenance

### Key Metrics
- Database connection count
- Query performance
- R2 storage usage
- Failed uploads/downloads
- Authentication success rate

### Backup Strategy
- PostgreSQL: Regular pg_dump backups
- R2: Built-in durability (11 9's)
- Point-in-time recovery capability

## Future Enhancements

### Planned Features
1. **Real-time Collaboration**: WebSocket integration
2. **Version History**: R2 object versioning
3. **Advanced Search**: Vector embeddings with pgvector
4. **Export/Import**: Multiple format support
5. **Workspace Sharing**: Team collaboration features

### Scaling Considerations
- Read replicas for PostgreSQL
- R2 multi-region replication
- Redis caching layer
- Microservices decomposition

## API Integration

### REST Endpoints
- `POST /api/notes` - Create note
- `GET /api/notes/:id` - Get note with content
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note
- `GET /api/search` - Search notes

### WebSocket Events
- `note:updated` - Real-time note changes
- `link:created` - New bidirectional links
- `workspace:shared` - Collaboration invites

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Check DATABASE_URL format
   - Verify network connectivity
   - Confirm PostgreSQL is running

2. **R2 Upload Failures**
   - Validate credentials
   - Check bucket permissions
   - Verify CORS settings

3. **Migration Issues**
   - Ensure PostgreSQL extensions enabled
   - Check file permissions
   - Verify schema compatibility

### Debug Commands
```bash
# Check database connection
npm run db:studio

# Test R2 connectivity
node -e "require('./app/lib/storage').r2Storage.noteExists('test')"

# Validate schema
npm run db:generate --check
```