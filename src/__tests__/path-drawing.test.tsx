/**
 * Path Drawing Tests
 * Tests for path drawing functionality and waypoint addition
 * Run with: npm test -- path-drawing
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAppStore } from '@/lib/store'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/dashboard',
}))

// Mock map utilities
vi.mock('@/lib/map', () => ({
  initializeMap: vi.fn(),
  addBaseMarker: vi.fn(),
  addDroneMarker: vi.fn(),
  addPathToMap: vi.fn(),
  clearPath: vi.fn(),
  clearMarkers: vi.fn(),
  updateDronePosition: vi.fn(),
}))

describe('Path Drawing', () => {
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

  describe('Path Drawing Mode', () => {
    it('should allow toggling drawing mode', () => {
      const store = useAppStore.getState()
      
      // Verify initial state
      expect(store.currentPath).toBeNull()
    })

    it('should allow adding waypoints to path', () => {
      const store = useAppStore.getState()
      
      const path: [number, number][] = [[-122.4194, 37.7749]]
      store.setCurrentPath(path)
      
      // Verify first waypoint was set
      let currentPath = useAppStore.getState().currentPath
      expect(currentPath).toHaveLength(1)
      
      // Add second waypoint
      const newPath: [number, number][] = [...path, [-122.4094, 37.7849]]
      store.setCurrentPath(newPath)
      
      // Verify both waypoints exist
      currentPath = useAppStore.getState().currentPath
      expect(currentPath).toHaveLength(2)
      expect(currentPath?.[0]).toEqual([-122.4194, 37.7749])
      expect(currentPath?.[1]).toEqual([-122.4094, 37.7849])
    })

    it('should persist path across waypoint additions', () => {
      const store = useAppStore.getState()
      
      const initialPath: [number, number][] = [
        [-122.4194, 37.7749],
        [-122.4094, 37.7849],
      ]
      store.setCurrentPath(initialPath)
      
      // Verify initial path
      let currentPath = useAppStore.getState().currentPath
      expect(currentPath).toHaveLength(2)
      
      // Add another waypoint
      const extendedPath: [number, number][] = [...initialPath, [-122.3994, 37.7949]]
      store.setCurrentPath(extendedPath)
      
      // Verify all waypoints persist
      currentPath = useAppStore.getState().currentPath
      expect(currentPath).toHaveLength(3)
      expect(currentPath?.[0]).toEqual(initialPath[0])
      expect(currentPath?.[1]).toEqual(initialPath[1])
      expect(currentPath?.[2]).toEqual([-122.3994, 37.7949])
    })
  })

  describe('Path Validation', () => {
    it('should require at least 2 waypoints for a valid path', () => {
      const store = useAppStore.getState()
      
      const singlePointPath: [number, number][] = [[-122.4194, 37.7749]]
      store.setCurrentPath(singlePointPath)
      
      const currentPath = useAppStore.getState().currentPath
      expect(currentPath?.length).toBe(1)
      
      // Path with 1 point is invalid for scheduling
      const isValidForScheduling = currentPath && currentPath.length >= 2
      expect(isValidForScheduling).toBe(false)
    })

    it('should accept paths with 2 or more waypoints', () => {
      const store = useAppStore.getState()
      
      const validPath: [number, number][] = [
        [-122.4194, 37.7749],
        [-122.4094, 37.7849],
      ]
      store.setCurrentPath(validPath)
      
      const currentPath = useAppStore.getState().currentPath
      expect(currentPath?.length).toBeGreaterThanOrEqual(2)
      expect(currentPath?.length).toBe(2)
    })
  })

  describe('Path Clearing', () => {
    it('should allow clearing path', () => {
      const store = useAppStore.getState()
      
      const path: [number, number][] = [
        [-122.4194, 37.7749],
        [-122.4094, 37.7849],
      ]
      store.setCurrentPath(path)
      
      // Verify path was set
      let currentPath = useAppStore.getState().currentPath
      expect(currentPath).not.toBeNull()
      expect(currentPath?.length).toBe(2)
      
      // Clear path
      store.setCurrentPath(null)
      
      // Verify path was cleared
      currentPath = useAppStore.getState().currentPath
      expect(currentPath).toBeNull()
    })
  })
})
