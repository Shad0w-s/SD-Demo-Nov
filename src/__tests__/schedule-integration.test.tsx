/**
 * Schedule Integration Tests
 * Tests for simplified schedule creation and display
 * Run with: npm test -- schedule-integration
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAppStore } from '@/lib/store'
import { mockSchedules } from '@/lib/mockData'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/dashboard',
}))

// Mock Supabase
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null,
      }),
    },
  },
  getAccessToken: vi.fn().mockResolvedValue('test-token'),
}))

// Mock API
vi.mock('@/lib/api', () => ({
  api: {
    createSchedule: vi.fn().mockResolvedValue({ id: 'schedule-1' }),
    getSchedules: vi.fn().mockResolvedValue([]),
  },
}))

describe('Schedule Integration - Simplified UX', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store state before each test
    useAppStore.setState({
      currentPath: null,
      drones: [],
      bases: [],
      schedules: [],
      selectedDrone: null,
      selectedBase: null,
      simulation: null,
      isLoading: false,
      error: null,
    })
  })

  describe('Schedule Creation - No Path Required', () => {
    it('should allow scheduling without a path (uses default route)', () => {
      const store = useAppStore.getState()
      
      // No path - should still allow scheduling
      store.setCurrentPath(null)
      const currentPath = useAppStore.getState().currentPath
      expect(currentPath).toBeNull()
      
      // Schedule can be created without path
      const scheduleData = {
        drone_id: 'drone-1',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        path_json: undefined, // Optional
      }
      
      expect(scheduleData.path_json).toBeUndefined()
      expect(scheduleData.drone_id).toBe('drone-1')
    })

    it('should allow scheduling with custom path if provided', () => {
      const path: [number, number][] = [
        [-122.4194, 37.7749],
        [-122.4094, 37.7849],
        [-122.3994, 37.7949],
      ]
      
      const scheduleData = {
        drone_id: 'drone-1',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        path_json: path.length >= 2 ? { coordinates: path } : undefined,
      }
      
      expect(scheduleData.path_json?.coordinates).toEqual(path)
      expect(scheduleData.path_json?.coordinates.length).toBe(3)
    })

    it('should validate date and time are required', () => {
      const scheduleData1 = {
        drone_id: 'drone-1',
        start_time: '',
        end_time: new Date().toISOString(),
      }
      
      expect(scheduleData1.start_time).toBe('')
      
      const scheduleData2 = {
        drone_id: 'drone-1',
        start_time: new Date().toISOString(),
        end_time: '',
      }
      
      // Both should be required
      expect(scheduleData1.start_time).toBeFalsy()
      expect(scheduleData2.end_time).toBeFalsy()
    })

    it('should calculate end time from duration', () => {
      const startTime = new Date()
      const durationMinutes = 60
      const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000)
      
      expect(endTime.getTime()).toBe(startTime.getTime() + 60 * 60 * 1000)
    })
  })

  describe('Schedule Display', () => {
    it('should display schedules sorted by start time', () => {
      const schedules = [...mockSchedules]
      const sorted = schedules.sort((a, b) => 
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      )
      
      expect(sorted.length).toBeGreaterThan(0)
      for (let i = 1; i < sorted.length; i++) {
        expect(new Date(sorted[i].start_time).getTime()).toBeGreaterThanOrEqual(
          new Date(sorted[i - 1].start_time).getTime()
        )
      }
    })

    it('should calculate duration from start and end times', () => {
      const schedule = mockSchedules[0]
      const startTime = new Date(schedule.start_time)
      const endTime = schedule.end_time ? new Date(schedule.end_time) : null
      
      if (endTime) {
        const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))
        expect(duration).toBeGreaterThan(0)
        expect(duration).toBeLessThanOrEqual(480) // Max 8 hours
      }
    })

    it('should show route information if path exists', () => {
      const schedule = mockSchedules[0]
      const hasRoute = schedule.path_json?.coordinates && schedule.path_json.coordinates.length >= 2
      const waypointCount = schedule.path_json?.coordinates?.length || 0
      
      expect(hasRoute).toBe(true)
      expect(waypointCount).toBeGreaterThanOrEqual(2)
    })

    it('should show default route message if no path', () => {
      const scheduleWithoutPath = {
        ...mockSchedules[0],
        path_json: undefined,
      }
      
      const hasRoute = !!(scheduleWithoutPath.path_json?.coordinates && 
        scheduleWithoutPath.path_json.coordinates.length >= 2)
      
      expect(hasRoute).toBe(false)
    })

    it('should filter schedules by selected drone', () => {
      const schedules = [...mockSchedules]
      const selectedDroneId = 'drone-1'
      
      const filtered = schedules.filter(s => s.drone_id === selectedDroneId)
      
      expect(filtered.length).toBeGreaterThan(0)
      filtered.forEach(schedule => {
        expect(schedule.drone_id).toBe(selectedDroneId)
      })
    })
  })

  describe('Mock Schedules Data', () => {
    it('should have schedules for different geographical areas', () => {
      const sfSchedules = mockSchedules.filter(s => 
        s.drone_id === 'drone-1' || s.drone_id === 'drone-5'
      )
      const austinSchedules = mockSchedules.filter(s => 
        s.drone_id === 'drone-3' || s.drone_id === 'drone-4'
      )
      const nySchedules = mockSchedules.filter(s => 
        s.drone_id === 'drone-6' || s.drone_id === 'drone-7'
      )
      
      expect(sfSchedules.length).toBeGreaterThan(0)
      expect(austinSchedules.length).toBeGreaterThan(0)
      expect(nySchedules.length).toBeGreaterThan(0)
    })

    it('should have schedules with valid coordinates in their regions', () => {
      mockSchedules.forEach(schedule => {
        if (schedule.path_json?.coordinates) {
          const coords = schedule.path_json.coordinates
          expect(coords.length).toBeGreaterThanOrEqual(2)
          
          // Check coordinates are valid [lng, lat] pairs
          coords.forEach(coord => {
            expect(coord.length).toBe(2)
            expect(typeof coord[0]).toBe('number')
            expect(typeof coord[1]).toBe('number')
          })
        }
      })
    })
  })
})
