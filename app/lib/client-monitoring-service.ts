import { clientAutoSaveService } from './client-auto-save-service'

export interface SystemMetrics {
  activeSessions: number
  pendingSaves: number
  offlineChanges: number
  memoryUsage: {
    used: number
    total: number
    percentage: number
  }
  performance: {
    avgSaveTime: number
    errorRate: number
    lastHourSaves: number
  }
  storage: {
    localStorage: {
      used: number
      available?: number
      itemCount: number
    }
  }
}

export interface PerformanceMetrics {
  saveStartTime: number
  saveEndTime: number
  success: boolean
  error?: string
  sessionId: string
  noteSize: number
}

export class ClientMonitoringService {
  private performanceMetrics: PerformanceMetrics[] = []
  private readonly MAX_METRICS = 1000 // Keep last 1000 operations
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000 // Clean up every 5 minutes
  
  private metricsListeners = new Set<(metrics: SystemMetrics) => void>()
  private cleanupTimer: NodeJS.Timeout

  constructor() {
    // Start periodic cleanup
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldMetrics()
    }, this.CLEANUP_INTERVAL)

    // Start periodic metrics reporting
    setInterval(() => {
      this.reportMetrics()
    }, 30000) // Report every 30 seconds
  }

  trackSaveOperation(sessionId: string, noteSize: number): {
    recordSuccess: () => void
    recordError: (error: string) => void
  } {
    const startTime = performance.now()
    
    return {
      recordSuccess: () => {
        this.performanceMetrics.push({
          saveStartTime: startTime,
          saveEndTime: performance.now(),
          success: true,
          sessionId,
          noteSize,
        })
        this.trimMetrics()
      },
      recordError: (error: string) => {
        this.performanceMetrics.push({
          saveStartTime: startTime,
          saveEndTime: performance.now(),
          success: false,
          error,
          sessionId,
          noteSize,
        })
        this.trimMetrics()
      }
    }
  }

  getMetrics(): SystemMetrics {
    const now = Date.now()
    const oneHourAgo = now - (60 * 60 * 1000)
    
    const recentMetrics = this.performanceMetrics.filter(
      m => m.saveEndTime > oneHourAgo
    )
    
    const successfulSaves = recentMetrics.filter(m => m.success)
    const failedSaves = recentMetrics.filter(m => !m.success)
    
    const avgSaveTime = successfulSaves.length > 0
      ? successfulSaves.reduce((sum, m) => sum + (m.saveEndTime - m.saveStartTime), 0) / successfulSaves.length
      : 0
    
    const errorRate = recentMetrics.length > 0
      ? (failedSaves.length / recentMetrics.length) * 100
      : 0

    return {
      activeSessions: clientAutoSaveService.getQueueSize(),
      pendingSaves: clientAutoSaveService.getPendingSaves().length,
      offlineChanges: this.getOfflineItemCount(),
      memoryUsage: this.getMemoryInfo(),
      performance: {
        avgSaveTime,
        errorRate,
        lastHourSaves: recentMetrics.length,
      },
      storage: {
        localStorage: this.getLocalStorageInfo(),
      },
    }
  }

  private getMemoryInfo() {
    // Browser memory estimation
    const nav = navigator as any
    if (nav.deviceMemory) {
      // Rough estimation based on available APIs
      const estimatedUsed = this.performanceMetrics.length * 0.001 // Rough MB estimate
      return {
        used: estimatedUsed,
        total: nav.deviceMemory * 1024, // Convert GB to MB
        percentage: (estimatedUsed / (nav.deviceMemory * 1024)) * 100,
      }
    }
    
    // Fallback estimation
    return {
      used: this.performanceMetrics.length * 0.001,
      total: 1024, // Assume 1GB
      percentage: (this.performanceMetrics.length * 0.001 / 1024) * 100,
    }
  }

  private getLocalStorageInfo() {
    let used = 0
    let itemCount = 0
    
    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length
          itemCount++
        }
      }
    } catch (error) {
      // Handle quota exceeded or other localStorage errors
    }
    
    return {
      used: used / 1024, // Convert to KB
      itemCount,
    }
  }

  private getOfflineItemCount(): number {
    let count = 0
    try {
      for (let key in localStorage) {
        if (key.startsWith('offline_note_')) {
          count++
        }
      }
    } catch (error) {
      // Handle localStorage errors
    }
    return count
  }

  isSystemUnderLoad(): boolean {
    const metrics = this.getMetrics()
    return (
      metrics.performance.errorRate > 10 || // More than 10% error rate
      metrics.performance.avgSaveTime > 5000 || // Average save time > 5 seconds
      metrics.pendingSaves > 10 // More than 10 pending saves
    )
  }

  getRecommendations(): string[] {
    const recommendations: string[] = []
    const metrics = this.getMetrics()
    
    if (metrics.performance.errorRate > 5) {
      recommendations.push('High error rate detected. Check network connection.')
    }
    
    if (metrics.performance.avgSaveTime > 3000) {
      recommendations.push('Slow save performance. Consider reducing document size.')
    }
    
    if (metrics.pendingSaves > 5) {
      recommendations.push('Multiple pending saves. Consider manual save.')
    }
    
    if (metrics.offlineChanges > 0) {
      recommendations.push(`${metrics.offlineChanges} offline changes need syncing.`)
    }
    
    if (metrics.storage.localStorage.used > 5000) { // 5MB
      recommendations.push('High localStorage usage. Consider clearing old data.')
    }
    
    return recommendations
  }

  performCleanup(): {
    cleaned: {
      oldMetrics: number
      expiredSessions: number
      offlineItems: number
    }
  } {
    const oldMetricsCount = this.performanceMetrics.length
    this.cleanupOldMetrics()
    const newMetricsCount = this.performanceMetrics.length
    
    // Clean up old offline items (older than 7 days)
    let cleanedOfflineItems = 0
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    
    try {
      for (let key in localStorage) {
        if (key.startsWith('offline_note_')) {
          const item = JSON.parse(localStorage[key])
          if (item.timestamp && item.timestamp < sevenDaysAgo) {
            localStorage.removeItem(key)
            cleanedOfflineItems++
          }
        }
      }
    } catch (error) {
      // Handle localStorage errors
    }
    
    return {
      cleaned: {
        oldMetrics: oldMetricsCount - newMetricsCount,
        expiredSessions: 0, // Client-side doesn't track sessions the same way
        offlineItems: cleanedOfflineItems,
      }
    }
  }

  onMetricsUpdate(listener: (metrics: SystemMetrics) => void): () => void {
    this.metricsListeners.add(listener)
    return () => this.metricsListeners.delete(listener)
  }

  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = 'timestamp,sessionId,success,saveTime,noteSize,error\n'
      const rows = this.performanceMetrics.map(m => 
        `${m.saveStartTime},${m.sessionId},${m.success},${m.saveEndTime - m.saveStartTime},${m.noteSize},"${m.error || ''}"`
      ).join('\n')
      return headers + rows
    }
    
    return JSON.stringify({
      metrics: this.performanceMetrics,
      summary: this.getMetrics(),
      timestamp: Date.now(),
    }, null, 2)
  }

  private cleanupOldMetrics(): void {
    const oneHourAgo = performance.now() - (60 * 60 * 1000)
    this.performanceMetrics = this.performanceMetrics.filter(
      m => m.saveEndTime > oneHourAgo
    )
  }

  private trimMetrics(): void {
    if (this.performanceMetrics.length > this.MAX_METRICS) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.MAX_METRICS)
    }
  }

  private reportMetrics(): void {
    const metrics = this.getMetrics()
    this.metricsListeners.forEach(listener => {
      try {
        listener(metrics)
      } catch (error) {
        console.error('Error in metrics listener:', error)
      }
    })
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
    this.metricsListeners.clear()
  }
}

export const clientMonitoringService = new ClientMonitoringService()

export function trackSavePerformance(sessionId: string, noteSize: number) {
  return clientMonitoringService.trackSaveOperation(sessionId, noteSize)
}