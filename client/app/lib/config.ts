// API Configuration
const DEFAULT_BACKEND_URL = 'http://localhost:3010'

export const apiConfig = {
  baseUrl: process.env.REACT_APP_API_URL || process.env.NEXT_PUBLIC_API_URL || DEFAULT_BACKEND_URL,

  endpoints: {
    health: '/api/health',
    emergencySave: '/api/emergency-save',
    notesSync: '/api/notes/sync',
    notes: '/api/notes',
    search: '/api/search',
    metrics: '/api/metrics',
    ai: {
      generate: '/api/ai/generate',
      tags: '/api/ai/tags',
      pull: '/api/ai/pull',
      delete: '/api/ai/delete',
      version: '/api/ai/version'
    }
  }
}

/**
 * Get the full URL for an API endpoint
 */
export function getApiUrl(endpoint: string): string {
  return `${apiConfig.baseUrl}${endpoint}`
}

/**
 * Get the base API URL
 */
export function getApiBaseUrl(): string {
  return apiConfig.baseUrl
}