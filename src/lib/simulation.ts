/**
 * Simulation Engine
 * Handles real-time simulation updates and drone position tracking
 */

import { SimulationState } from './store'

export interface SimulationUpdate {
  progress: number
  currentPosition: [number, number]
  telemetry: SimulationState['telemetry']
  speed: number
  timeRemaining: number
}

export class SimulationEngine {
  private intervalId: NodeJS.Timeout | null = null
  private path: [number, number][] = []
  private startTime: number = 0
  private totalDuration: number = 0
  private onUpdate: ((update: SimulationUpdate) => void) | null = null
  private onComplete: (() => void) | null = null
  private isPaused: boolean = false
  private pausedTime: number = 0
  private pauseStartTime: number = 0

  start(
    path: [number, number][],
    duration: number,
    initialTelemetry: SimulationState['telemetry'],
    onUpdate: (update: SimulationUpdate) => void,
    onComplete: () => void
  ) {
    this.path = path
    this.totalDuration = duration
    this.startTime = Date.now()
    this.onUpdate = onUpdate
    this.onComplete = onComplete
    this.isPaused = false
    this.pausedTime = 0

    this.run()
  }

  private run() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }

    this.intervalId = setInterval(() => {
      if (this.isPaused) {
        return
      }

      const elapsed = Date.now() - this.startTime - this.pausedTime
      const progress = Math.min((elapsed / (this.totalDuration * 1000)) * 100, 100)
      const timeRemaining = Math.max(0, Math.ceil((this.totalDuration * 1000 - elapsed) / 1000))

      // Calculate current position based on progress
      const currentPosition = this.calculatePosition(progress)

      // Update telemetry with slight variations
      const telemetry = this.updateTelemetry(progress)

      // Calculate current speed (slightly variable)
      const speed = 12 + Math.sin(progress / 10) * 2

      if (this.onUpdate) {
        this.onUpdate({
          progress,
          currentPosition,
          telemetry,
          speed,
          timeRemaining,
        })
      }

      if (progress >= 100) {
        this.stop()
        if (this.onComplete) {
          this.onComplete()
        }
      }
    }, 100) // Update every 100ms
  }

  private calculatePosition(progress: number): [number, number] {
    if (this.path.length === 0) {
      return [-122.4194, 37.7749] // Default position
    }

    if (this.path.length === 1) {
      return this.path[0]
    }

    const totalSegments = this.path.length - 1
    const progressPerSegment = 100 / totalSegments
    const currentSegment = Math.min(
      Math.floor(progress / progressPerSegment),
      totalSegments - 1
    )

    const segmentProgress = (progress % progressPerSegment) / progressPerSegment
    const startPoint = this.path[currentSegment]
    const endPoint = this.path[currentSegment + 1]

    const lng = startPoint[0] + (endPoint[0] - startPoint[0]) * segmentProgress
    const lat = startPoint[1] + (endPoint[1] - startPoint[1]) * segmentProgress

    return [lng, lat]
  }

  private updateTelemetry(progress: number): SimulationState['telemetry'] {
    // Simulate realistic telemetry changes during flight
    const batteryDrain = progress * 0.3 // 30% battery drain over full flight
    const altitudeVariation = Math.sin(progress / 20) * 20 // Slight altitude variation
    const headingChange = progress * 3.6 // Gradual heading change
    const signalVariation = Math.sin(progress / 15) * 5 // Signal variation

    return {
      battery_level: Math.max(70, 100 - batteryDrain),
      altitude_m: 100 + altitudeVariation,
      heading_deg: (headingChange % 360),
      signal_strength: Math.max(75, 95 - signalVariation),
    }
  }

  pause() {
    if (!this.isPaused && this.intervalId) {
      this.isPaused = true
      this.pauseStartTime = Date.now()
    }
  }

  resume() {
    if (this.isPaused) {
      this.isPaused = false
      this.pausedTime += Date.now() - this.pauseStartTime
      this.pauseStartTime = 0
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isPaused = false
    this.path = []
  }

  isRunning(): boolean {
    return this.intervalId !== null
  }
}

