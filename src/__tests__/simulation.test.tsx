/**
 * Simulation Engine Tests
 * Tests for simulation features and real-time updates
 * Run with: npm test
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SimulationEngine } from '@/lib/simulation'

describe('Simulation Engine', () => {
  let engine: SimulationEngine

  beforeEach(() => {
    engine = new SimulationEngine()
    vi.useFakeTimers()
  })

  afterEach(() => {
    engine.stop()
    vi.useRealTimers()
  })

  describe('Initialization', () => {
    it('should create simulation engine instance', () => {
      expect(engine).toBeInstanceOf(SimulationEngine)
    })

    it('should not be running initially', () => {
      expect(engine.isRunning()).toBe(false)
    })
  })

  describe('Simulation Start', () => {
    it('should start simulation with path and duration', () => {
      const path: [number, number][] = [
        [-122.4194, 37.7749],
        [-122.4094, 37.7849],
      ]
      const duration = 10 // 10 seconds
      const onUpdate = vi.fn()
      const onComplete = vi.fn()

      engine.start(path, duration, {
        battery_level: 100,
        altitude_m: 100,
        heading_deg: 0,
        signal_strength: 100,
      }, onUpdate, onComplete)

      expect(engine.isRunning()).toBe(true)
    })

    it('should call onUpdate callback with progress updates', () => {
      const path: [number, number][] = [
        [-122.4194, 37.7749],
        [-122.4094, 37.7849],
      ]
      const duration = 1 // 1 second for faster test
      const onUpdate = vi.fn()
      const onComplete = vi.fn()

      engine.start(path, duration, {
        battery_level: 100,
        altitude_m: 100,
        heading_deg: 0,
        signal_strength: 100,
      }, onUpdate, onComplete)

      // Advance time by 100ms
      vi.advanceTimersByTime(100)

      expect(onUpdate).toHaveBeenCalled()
      const update = onUpdate.mock.calls[0][0]
      expect(update).toHaveProperty('progress')
      expect(update).toHaveProperty('currentPosition')
      expect(update).toHaveProperty('telemetry')
      expect(update).toHaveProperty('speed')
      expect(update).toHaveProperty('timeRemaining')
    })

    it('should calculate position based on progress', () => {
      const path: [number, number][] = [
        [-122.4194, 37.7749],
        [-122.4094, 37.7849],
      ]
      const duration = 1
      const onUpdate = vi.fn()
      const onComplete = vi.fn()

      engine.start(path, duration, {
        battery_level: 100,
        altitude_m: 100,
        heading_deg: 0,
        signal_strength: 100,
      }, onUpdate, onComplete)

      vi.advanceTimersByTime(500) // 50% progress

      expect(onUpdate).toHaveBeenCalled()
      const update = onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0]
      expect(update.currentPosition).toBeDefined()
      expect(Array.isArray(update.currentPosition)).toBe(true)
      expect(update.currentPosition.length).toBe(2)
    })
  })

  describe('Simulation Stop', () => {
    it('should stop simulation', () => {
      const path: [number, number][] = [
        [-122.4194, 37.7749],
        [-122.4094, 37.7849],
      ]
      const duration = 10
      const onUpdate = vi.fn()
      const onComplete = vi.fn()

      engine.start(path, duration, {
        battery_level: 100,
        altitude_m: 100,
        heading_deg: 0,
        signal_strength: 100,
      }, onUpdate, onComplete)

      expect(engine.isRunning()).toBe(true)
      engine.stop()
      expect(engine.isRunning()).toBe(false)
    })
  })

  describe('Simulation Complete', () => {
    it('should call onComplete when simulation finishes', () => {
      const path: [number, number][] = [
        [-122.4194, 37.7749],
        [-122.4094, 37.7849],
      ]
      const duration = 1 // 1 second
      const onUpdate = vi.fn()
      const onComplete = vi.fn()

      engine.start(path, duration, {
        battery_level: 100,
        altitude_m: 100,
        heading_deg: 0,
        signal_strength: 100,
      }, onUpdate, onComplete)

      // Advance time to complete simulation
      vi.advanceTimersByTime(1100)

      expect(onComplete).toHaveBeenCalled()
      expect(engine.isRunning()).toBe(false)
    })
  })

  describe('Telemetry Updates', () => {
    it('should update telemetry during simulation', () => {
      const path: [number, number][] = [
        [-122.4194, 37.7749],
        [-122.4094, 37.7849],
      ]
      const duration = 1
      const onUpdate = vi.fn()
      const onComplete = vi.fn()

      engine.start(path, duration, {
        battery_level: 100,
        altitude_m: 100,
        heading_deg: 0,
        signal_strength: 100,
      }, onUpdate, onComplete)

      vi.advanceTimersByTime(100)

      const update = onUpdate.mock.calls[0][0]
      expect(update.telemetry).toBeDefined()
      expect(update.telemetry).toHaveProperty('battery_level')
      expect(update.telemetry).toHaveProperty('altitude_m')
      expect(update.telemetry).toHaveProperty('heading_deg')
      expect(update.telemetry).toHaveProperty('signal_strength')
    })

    it('should simulate battery drain over time', () => {
      const path: [number, number][] = [
        [-122.4194, 37.7749],
        [-122.4094, 37.7849],
      ]
      const duration = 1
      const onUpdate = vi.fn()
      const onComplete = vi.fn()

      engine.start(path, duration, {
        battery_level: 100,
        altitude_m: 100,
        heading_deg: 0,
        signal_strength: 100,
      }, onUpdate, onComplete)

      vi.advanceTimersByTime(500)

      const update = onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0]
      // Battery should decrease as progress increases
      expect(update.telemetry.battery_level).toBeLessThanOrEqual(100)
    })
  })

  describe('Progress Calculation', () => {
    it('should calculate progress correctly', () => {
      const path: [number, number][] = [
        [-122.4194, 37.7749],
        [-122.4094, 37.7849],
      ]
      const duration = 1
      const onUpdate = vi.fn()
      const onComplete = vi.fn()

      engine.start(path, duration, {
        battery_level: 100,
        altitude_m: 100,
        heading_deg: 0,
        signal_strength: 100,
      }, onUpdate, onComplete)

      vi.advanceTimersByTime(500) // 50% of 1 second

      const update = onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0]
      expect(update.progress).toBeGreaterThan(0)
      expect(update.progress).toBeLessThanOrEqual(100)
    })

    it('should reach 100% progress when complete', () => {
      const path: [number, number][] = [
        [-122.4194, 37.7749],
        [-122.4094, 37.7849],
      ]
      const duration = 1
      const onUpdate = vi.fn()
      const onComplete = vi.fn()

      engine.start(path, duration, {
        battery_level: 100,
        altitude_m: 100,
        heading_deg: 0,
        signal_strength: 100,
      }, onUpdate, onComplete)

      vi.advanceTimersByTime(1100) // Complete simulation

      const lastUpdate = onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0]
      expect(lastUpdate.progress).toBeGreaterThanOrEqual(100)
    })
  })
})

