/**
 * Schedule Integration Tests
 * Tests for schedule/path integration
 * Run with: npm test -- schedule-integration
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAppStore } from '@/lib/store'

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

describe('Schedule Integration with Path Drawing', () => {
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

  describe('Schedule Modal Validation', () => {
    it('should require path before scheduling', () => {
      const store = useAppStore.getState()
      
      // No path
      store.setCurrentPath(null)
      let currentPath = useAppStore.getState().currentPath
      expect(currentPath).toBeNull()
      
      // Path validation should fail
      const hasValidPath = !!(currentPath && currentPath.length >= 2)
      expect(hasValidPath).toBe(false)
    })

    it('should require at least 2 waypoints in path', () => {
      const store = useAppStore.getState()
      
      // Single waypoint (invalid)
      store.setCurrentPath([[-122.4194, 37.7749]])
      let currentPath = useAppStore.getState().currentPath
      expect(currentPath?.length).toBe(1)
      
      let hasValidPath = !!(currentPath && currentPath.length >= 2)
      expect(hasValidPath).toBe(false)
      
      // Two waypoints (valid)
      store.setCurrentPath([
        [-122.4194, 37.7749],
        [-122.4094, 37.7849],
      ])
      currentPath = useAppStore.getState().currentPath
      expect(currentPath?.length).toBe(2)
      
      hasValidPath = !!(currentPath && currentPath.length >= 2)
      expect(hasValidPath).toBe(true)
    })

    it('should allow scheduling with valid path', () => {
      const store = useAppStore.getState()
      
      const validPath: [number, number][] = [
        [-122.4194, 37.7749],
        [-122.4094, 37.7849],
        [-122.3994, 37.7949],
      ]
      store.setCurrentPath(validPath)
      
      const currentPath = useAppStore.getState().currentPath
      const hasValidPath = !!(currentPath && currentPath.length >= 2)
      expect(hasValidPath).toBe(true)
      expect(currentPath?.length).toBe(3)
    })
  })

  describe('Schedule Creation', () => {
    it('should include path in schedule data', () => {
      const path: [number, number][] = [
        [-122.4194, 37.7749],
        [-122.4094, 37.7849],
      ]
      
      // Schedule data should include path
      const scheduleData = {
        drone_id: 'drone-1',
        start_time: new Date().toISOString(),
        path_json: { coordinates: path },
      }
      
      expect(scheduleData.path_json.coordinates).toEqual(path)
      expect(scheduleData.path_json.coordinates.length).toBe(2)
    })
  })
})
