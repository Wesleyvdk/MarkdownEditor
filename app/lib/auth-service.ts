// Simple auth service for development
export interface UserSession {
  userId: string
  email: string
  username: string
  displayName?: string
}

// For now, we'll use a simple demo user approach
export class AuthService {
  private demoUser: UserSession = {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    email: 'demo@example.com',
    username: 'demo',
    displayName: 'Demo User'
  }

  /**
   * Get current user (for demo purposes, always returns demo user)
   */
  async getCurrentUser(): Promise<UserSession> {
    return this.demoUser
  }

  /**
   * Create demo session
   */
  async createDemoSession(): Promise<UserSession> {
    return this.demoUser
  }

  /**
   * Validate session (always valid for demo)
   */
  async validateSession(): Promise<UserSession> {
    return this.demoUser
  }
}

// Singleton instance
export const authService = new AuthService()