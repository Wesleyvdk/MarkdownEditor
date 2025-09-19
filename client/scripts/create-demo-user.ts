import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { users } from '../app/database/schema'

// Create database connection using the same approach as the app
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_70UlVJdrbBNc@ep-autumn-snow-a25nk17o-pooler.eu-central-1.aws.neon.tech/markdowneditor?sslmode=require&channel_binding=require',
})

const db = drizzle(pool)

async function createDemoUser() {
  try {
    const demoUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'demo@example.com',
      username: 'demo',
      passwordHash: 'demo-hash',
      displayName: 'Demo User'
    }

    await db.insert(users).values(demoUser).onConflictDoNothing()
    console.log('Demo user created successfully')
  } catch (error) {
    console.error('Error creating demo user:', error)
  } finally {
    await pool.end()
    process.exit(0)
  }
}

createDemoUser()