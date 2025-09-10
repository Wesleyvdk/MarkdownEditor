import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { db } from '../app/database/connection'

async function runMigrations() {
  console.log('Running database migrations...')
  
  try {
    await migrate(db, { migrationsFolder: './app/database/migrations' })
    console.log('Migrations completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

runMigrations()