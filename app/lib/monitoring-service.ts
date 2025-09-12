import { autoSaveService } from './auto-save-service'
import { offlineService } from './offline-service'

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

export class MonitoringService {
  private performanceMetrics: PerformanceMetrics[] = []
  private readonly MAX_METRICS = 1000 // Keep last 1000 operations
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000 // Clean up every 5 minutes
  
  private metricsListeners = new Set<(metrics: SystemMetrics) => void>()
  private cleanupTimer: NodeJS.Timeout

  constructor() {
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldMetrics()
    }, this.CLEANUP_INTERVAL)
    
    // Start periodic metrics reporting
    setInterval(() => {
      this.reportMetrics()
    }, 30000) // Report every 30 seconds
  }

  /**
   * Track a save operation performance
   */
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

  /**
   * Get current system metrics
   */
  getMetrics(): SystemMetrics {
    const now = Date.now()
    const oneHourAgo = now - (60 * 60 * 1000)
    
    // Recent metrics (last hour)
    const recentMetrics = this.performanceMetrics.filter(
      m => m.saveStartTime > oneHourAgo
    )
    
    const successfulSaves = recentMetrics.filter(m => m.success)
    const failedSaves = recentMetrics.filter(m => !m.success)
    
    // Calculate average save time
    const avgSaveTime = successfulSaves.length > 0
      ? successfulSaves.reduce((sum, m) => sum + (m.saveEndTime - m.saveStartTime), 0) / successfulSaves.length
      : 0

    // Calculate error rate
    const errorRate = recentMetrics.length > 0
      ? (failedSaves.length / recentMetrics.length) * 100
      : 0

    // Memory usage (estimate)
    const memoryInfo = this.getMemoryInfo()
    
    // Storage info
    const storageInfo = offlineService.getStorageInfo()

    return {
      activeSessions: autoSaveService.getQueueSize(),
      pendingSaves: autoSaveService.getPendingSaves().filter(p => p.state.isDirty).length,
      offlineChanges: offlineService.getOfflineChanges().length,
      memoryUsage: memoryInfo,
      performance: {
        avgSaveTime: Math.round(avgSaveTime * 100) / 100, // Round to 2 decimal places
        errorRate: Math.round(errorRate * 100) / 100,
        lastHourSaves: recentMetrics.length,
      },
      storage: {
        localStorage: storageInfo,
      },
    }
  }

  /**
   * Estimate memory usage (basic implementation)
   */
  private getMemoryInfo() {
    // Basic memory estimation
    const pendingSaves = autoSaveService.getPendingSaves()
    const offlineChanges = offlineService.getOfflineChanges()
    
    let estimatedUsage = 0
    
    // Estimate memory usage of pending saves
    pendingSaves.forEach(({ state }) => {
      estimatedUsage += (state.title.length + state.content.length) * 2 // UTF-16
      estimatedUsage += state.tags.reduce((sum, tag) => sum + tag.length * 2, 0)
      estimatedUsage += 200 // Overhead per object
    })
    
    // Estimate memory usage of offline changes
    offlineChanges.forEach(change => {
      estimatedUsage += (change.title.length + change.content.length) * 2
      estimatedUsage += change.tags.reduce((sum, tag) => sum + tag.length * 2, 0)
      estimatedUsage += 300 // Overhead per offline object
    })
    
    // Performance metrics memory
    estimatedUsage += this.performanceMetrics.length * 150 // Estimated size per metric
    
    // Browser memory API (if available)
    const total = (performance as any).memory?.totalJSHeapSize ?? estimatedUsage * 10
    const used = (performance as any).memory?.usedJSHeapSize ?? estimatedUsage
    
    return {
      used,
      total,
      percentage: Math.round((used / total) * 100),
    }
  }

  /**
   * Check if system is under high load
   */
  isSystemUnderLoad(): boolean {
    const metrics = this.getMetrics()
    
    return (
      metrics.activeSessions > 1000 || // More than 1000 active sessions
      metrics.pendingSaves > 500 ||    // More than 500 pending saves
      metrics.performance.errorRate > 10 || // More than 10% error rate
      metrics.memoryUsage.percentage > 85    // More than 85% memory usage
    )
  }

  /**
   * Get performance recommendations
   */
  getRecommendations(): string[] {
    const metrics = this.getMetrics()
    const recommendations: string[] = []

    if (metrics.activeSessions > 5000) {
      recommendations.push('Consider implementing connection pooling or load balancing')
    }

    if (metrics.pendingSaves > 200) {
      recommendations.push('High number of pending saves detected - consider optimizing save performance')
    }

    if (metrics.performance.errorRate > 5) {
      recommendations.push('High error rate detected - check network connectivity and server health')
    }

    if (metrics.memoryUsage.percentage > 70) {
      recommendations.push('High memory usage - consider implementing garbage collection or reducing cache size')
    }

    if (metrics.offlineChanges > 50) {
      recommendations.push('Many offline changes pending - check network connectivity')
    }

    if (metrics.performance.avgSaveTime > 2000) {
      recommendations.push('Slow save performance - consider optimizing backend or using compression')
    }

    return recommendations
  }

  /**
   * Force garbage collection of unused data
   */
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

    // Could add session cleanup here if needed
    const expiredSessions = 0

    // Cleanup offline storage
    const oldOfflineCount = offlineService.getOfflineChanges().length
    // Note: We don't automatically clean offline data as it might be important
    const newOfflineCount = oldOfflineCount

    return {
      cleaned: {
        oldMetrics: oldMetricsCount - newMetricsCount,
        expiredSessions,
        offlineItems: oldOfflineCount - newOfflineCount,
      }
    }
  }

  /**
   * Subscribe to metrics updates
   */
  onMetricsUpdate(listener: (metrics: SystemMetrics) => void): () => void {
    this.metricsListeners.add(listener)
    return () => this.metricsListeners.delete(listener)
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    const metrics = this.getMetrics()
    const recentPerformance = this.performanceMetrics.slice(-100) // Last 100 operations

    const exportData = {
      timestamp: new Date().toISOString(),
      systemMetrics: metrics,
      recentPerformance,
    }

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2)
    } else {
      // Basic CSV export
      const csvHeaders = 'timestamp,activeSessions,pendingSaves,avgSaveTime,errorRate'
      const csvRow = `${exportData.timestamp},${metrics.activeSessions},${metrics.pendingSaves},${metrics.performance.avgSaveTime},${metrics.performance.errorRate}`
      return `${csvHeaders}\\n${csvRow}`
    }
  }

  private cleanupOldMetrics(): void {
    const oneHourAgo = performance.now() - (60 * 60 * 1000)
    this.performanceMetrics = this.performanceMetrics.filter(
      m => m.saveStartTime > oneHourAgo
    )
  }

  private trimMetrics(): void {
    if (this.performanceMetrics.length > this.MAX_METRICS) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.MAX_METRICS)
    }
  }

  private reportMetrics(): void {
    const metrics = this.getMetrics()
    
    // Notify listeners
    this.metricsListeners.forEach(listener => {
      try {
        listener(metrics)
      } catch (error) {
        console.error('Error in metrics listener:', error)
      }
    })

    // Log warnings for high load conditions
    if (this.isSystemUnderLoad()) {
      console.warn('System under high load:', {
        activeSessions: metrics.activeSessions,
        pendingSaves: metrics.pendingSaves,
        errorRate: metrics.performance.errorRate,
        memoryUsage: metrics.memoryUsage.percentage + '%',
      })
    }

    // In production, you might want to send these metrics to a monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(metrics)
    }
  }

  private async sendToMonitoringService(metrics: SystemMetrics): Promise<void> {
    try {
      // Example: Send to external monitoring service
      await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics),
      })
    } catch (error) {
      console.error('Failed to send metrics to monitoring service:', error)
    }
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
    this.metricsListeners.clear()
  }
}

// Singleton instance
export const monitoringService = new MonitoringService()

// Export performance tracking helper
export function trackSavePerformance(sessionId: string, noteSize: number) {
  return monitoringService.trackSaveOperation(sessionId, noteSize)
}