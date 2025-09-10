import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../database/connection'
import { users, type User, type NewUser } from '../database/schema'
import { eq } from 'drizzle-orm'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  username: string
  password: string
  displayName?: string
}

export interface AuthUser {
  id: string
  email: string
  username: string
  displayName?: string
}

export class AuthService {
  private jwtSecret: string

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production'
  }

  async register(data: RegisterData): Promise<{ user: AuthUser; token: string }> {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .then(results => results[0])

    if (existingUser) {
      throw new Error('User already exists with this email')
    }

    // Check username availability
    const existingUsername = await db
      .select()
      .from(users)
      .where(eq(users.username, data.username))
      .then(results => results[0])

    if (existingUsername) {
      throw new Error('Username is already taken')
    }

    // Hash password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(data.password, saltRounds)

    // Create user
    const [newUser] = await db.insert(users).values({
      email: data.email,
      username: data.username,
      passwordHash,
      displayName: data.displayName || data.username,
    }).returning()

    // Generate JWT token
    const token = this.generateToken(newUser.id)

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        displayName: newUser.displayName || undefined,
      },
      token
    }
  }

  async login(credentials: LoginCredentials): Promise<{ user: AuthUser; token: string }> {
    // Find user by email
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, credentials.email))
      .then(results => results[0])

    if (!user) {
      throw new Error('Invalid email or password')
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash)
    if (!isValidPassword) {
      throw new Error('Invalid email or password')
    }

    // Update last login
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id))

    // Generate JWT token
    const token = this.generateToken(user.id)

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName || undefined,
      },
      token
    }
  }

  async getUserById(userId: string): Promise<AuthUser | null> {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .then(results => results[0])

    if (!user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName || undefined,
    }
  }

  verifyToken(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as { userId: string }
      return decoded
    } catch (error) {
      return null
    }
  }

  private generateToken(userId: string): string {
    return jwt.sign({ userId }, this.jwtSecret, { expiresIn: '7d' })
  }

  async updateProfile(userId: string, data: { displayName?: string; email?: string }): Promise<AuthUser> {
    const [updatedUser] = await db
      .update(users)
      .set({
        displayName: data.displayName,
        email: data.email,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning()

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      displayName: updatedUser.displayName || undefined,
    }
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    // Get current user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .then(results => results[0])

    if (!user) {
      throw new Error('User not found')
    }

    // Verify old password
    const isValidPassword = await bcrypt.compare(oldPassword, user.passwordHash)
    if (!isValidPassword) {
      throw new Error('Current password is incorrect')
    }

    // Hash new password
    const saltRounds = 12
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

    // Update password
    await db
      .update(users)
      .set({ 
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
  }
}

export const authService = new AuthService()