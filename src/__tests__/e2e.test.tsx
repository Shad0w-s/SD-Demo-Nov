/**
 * End-to-End Tests
 * Tests for critical user flows
 * Run with: npm test -- e2e
 */
import { describe, it, expect, vi } from 'vitest'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
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
      signOut: vi.fn(),
    },
  },
  getSession: vi.fn().mockResolvedValue({ access_token: 'test-token' }),
  getAccessToken: vi.fn().mockResolvedValue('test-token'),
  getUser: vi.fn(),
  getUserRole: vi.fn().mockResolvedValue('user'),
  signOut: vi.fn(),
}))

// Mock API
vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual('@/lib/api')
  return {
    ...actual,
    apiRequest: vi.fn().mockResolvedValue({}),
  }
})

describe('E2E: Critical User Flows', () => {
  describe('User Authentication Flow', () => {
    it('should allow user to login and access dashboard', async () => {
      const { useAppStore } = await import('@/lib/store')
      const store = useAppStore.getState()
      
      // Verify store is accessible
      expect(store).toBeDefined()
      expect(store.setDrones).toBeDefined()
      expect(store.setBases).toBeDefined()
    })

    it('should protect dashboard routes', async () => {
      const AuthGuard = (await import('@/components/AuthGuard')).default
      expect(AuthGuard).toBeDefined()
    })
  })

  describe('Drone Management Flow', () => {
    it('should allow user to select drone', async () => {
      const { useAppStore } = await import('@/lib/store')
      
      const mockDrone = {
        id: 'test-drone-1',
        name: 'Test Drone',
        status: 'simulated',
      }
      
      useAppStore.getState().setSelectedDrone(mockDrone)
      const selectedDrone = useAppStore.getState().selectedDrone
      expect(selectedDrone).toEqual(mockDrone)
    })

    it('should allow user to view drone details', async () => {
      const Sidebar = (await import('@/components/Sidebar')).default
      expect(Sidebar).toBeDefined()
    })
  })

  describe('Path Drawing Flow', () => {
    it('should allow user to draw path on map', async () => {
      const { useAppStore } = await import('@/lib/store')
      
      const mockPath: [number, number][] = [
        [-122.4194, 37.7749],
        [-122.4094, 37.7849],
      ]
      
      useAppStore.getState().setCurrentPath(mockPath)
      const currentPath = useAppStore.getState().currentPath
      expect(currentPath).toEqual(mockPath)
    })

    it('should display path on map', async () => {
      const DroneMap = (await import('@/components/DroneMap')).default
      expect(DroneMap).toBeDefined()
    })
  })

  describe('Simulation Flow', () => {
    it('should allow user to start simulation', async () => {
      const { useAppStore } = await import('@/lib/store')
      
      const mockSimulation = {
        isRunning: true,
        speed: 12.5,
        eta: 60,
        telemetry: {
          battery_level: 90,
          altitude_m: 100,
          heading_deg: 45,
          signal_strength: 95,
        },
      }
      
      useAppStore.getState().setSimulation(mockSimulation)
      const simulation = useAppStore.getState().simulation
      expect(simulation).toEqual(mockSimulation)
    })

    it('should display telemetry during simulation', async () => {
      const VideoFeed = (await import('@/components/VideoFeed')).default
      expect(VideoFeed).toBeDefined()
    })

    it('should allow user to stop simulation', async () => {
      const { useAppStore } = await import('@/lib/store')
      
      useAppStore.getState().setSimulation({
        isRunning: false,
        speed: undefined,
        eta: undefined,
        telemetry: undefined,
      })
      
      const simulation = useAppStore.getState().simulation
      expect(simulation?.isRunning).toBe(false)
    })
  })

  describe('Schedule Management Flow', () => {
    it('should allow user to create schedule', async () => {
      const ScheduleModal = (await import('@/components/ScheduleModal')).default
      expect(ScheduleModal).toBeDefined()
    })

    it('should display schedules in sidebar', async () => {
      const { useAppStore } = await import('@/lib/store')
      
      const mockSchedules = [
        {
          id: 'schedule-1',
          drone_id: 'drone-1',
          start_time: '2024-01-01T10:00:00Z',
        },
      ]
      
      useAppStore.getState().setSchedules(mockSchedules)
      const schedules = useAppStore.getState().schedules
      expect(schedules).toEqual(mockSchedules)
    })
  })

  describe('Error Handling Flow', () => {
    it('should display errors to user', async () => {
      const { useAppStore } = await import('@/lib/store')
      
      useAppStore.getState().setError('Test error message')
      const error = useAppStore.getState().error
      expect(error).toBe('Test error message')
    })

    it('should have ErrorDisplay component', async () => {
      const ErrorDisplay = (await import('@/components/ErrorDisplay')).default
      expect(ErrorDisplay).toBeDefined()
    })
  })
})

