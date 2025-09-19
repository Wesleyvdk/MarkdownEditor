import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './app/database/schema.ts',
  out: './app/database/migrations',
  dialect: 'postgresql',
  dbCredentials: process.env.DATABASE_URL 
    ? { url: process.env.DATABASE_URL }
    : {
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        user: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD || '',
        database: process.env.DATABASE_NAME || 'obsidian_clone',
      },
  verbose: true,
  strict: true,
})