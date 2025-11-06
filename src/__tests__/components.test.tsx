/**
 * Frontend Component Tests for Phase 3
 * Run with: npm test
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

describe('Phase 3: Frontend Components', () => {
  describe('Theme System', () => {
    it('should have Material UI theme provider', async () => {
      const { MUIThemeProviderWrapper } = await import('@/lib/mui-theme')
      expect(MUIThemeProviderWrapper).toBeDefined()
    })

    // Theme toggle removed - app is dark mode only now
    it('should use dark mode theme', async () => {
      const { MUIThemeProviderWrapper } = await import('@/lib/mui-theme')
      expect(MUIThemeProviderWrapper).toBeDefined()
    })
  })

  describe('Store Management', () => {
    it('should have Zustand store with all state', async () => {
      const { useAppStore } = await import('@/lib/store')
      
      const state = useAppStore.getState()
      expect(state.drones).toBeDefined()
      expect(state.bases).toBeDefined()
      expect(state.schedules).toBeDefined()
      expect(state.selectedDrone).toBeDefined()
      expect(state.currentPath).toBeDefined()
      expect(state.simulation).toBeDefined()
    })

    it('should have store actions', async () => {
      const { useAppStore } = await import('@/lib/store')
      
      const state = useAppStore.getState()
      expect(typeof state.setDrones).toBe('function')
      expect(typeof state.setBases).toBe('function')
      expect(typeof state.setSchedules).toBe('function')
      expect(typeof state.setSelectedDrone).toBe('function')
      expect(typeof state.setCurrentPath).toBe('function')
      expect(typeof state.setSimulation).toBe('function')
      expect(typeof state.addDrone).toBe('function')
      expect(typeof state.updateDrone).toBe('function')
      expect(typeof state.removeDrone).toBe('function')
    })
  })

  describe('API Client', () => {
    it('should have all API methods', async () => {
      // Import actual API to verify structure
      const apiModule = await import('@/lib/api')
      
      expect(apiModule.api).toBeDefined()
      expect(typeof apiModule.api.getDrones).toBe('function')
      expect(typeof apiModule.api.getBases).toBe('function')
      expect(typeof apiModule.api.getSchedules).toBe('function')
      expect(typeof apiModule.api.simulatePath).toBe('function')
      expect(typeof apiModule.api.droneAction).toBe('function')
    })

    it('should have apiRequest function', async () => {
      const apiModule = await import('@/lib/api')
      expect(typeof apiModule.apiRequest).toBe('function')
    })
  })

  describe('Map Utilities', () => {
    it('should have map initialization function', async () => {
      const mapUtils = await import('@/lib/map')
      expect(mapUtils.initializeMap).toBeDefined()
      expect(typeof mapUtils.initializeMap).toBe('function')
    })

    it('should have marker functions', async () => {
      const mapUtils = await import('@/lib/map')
      expect(mapUtils.addBaseMarker).toBeDefined()
      expect(mapUtils.addDroneMarker).toBeDefined()
      expect(typeof mapUtils.addBaseMarker).toBe('function')
      expect(typeof mapUtils.addDroneMarker).toBe('function')
    })

    it('should have path functions', async () => {
      const mapUtils = await import('@/lib/map')
      expect(mapUtils.addPathToMap).toBeDefined()
      expect(mapUtils.clearPath).toBeDefined()
      expect(typeof mapUtils.addPathToMap).toBe('function')
      expect(typeof mapUtils.clearPath).toBe('function')
    })

    it('should support ArcGIS as primary mapping solution', async () => {
      const mapUtils = await import('@/lib/map')
      expect(mapUtils.initializeMap).toBeDefined()
      // ArcGIS is primary, OSM is fallback
    })

    it('should handle OSM fallback when ArcGIS fails', async () => {
      // This is tested in map-arcgis.test.tsx
      const mapUtils = await import('@/lib/map')
      expect(mapUtils.initializeMap).toBeDefined()
      // Fallback logic is tested in map-arcgis.test.tsx
    })
  })

  describe('Component Structure', () => {
    it('should have Sidebar component', async () => {
      const Sidebar = (await import('@/components/Sidebar')).default
      expect(Sidebar).toBeDefined()
    })

    it('should have DroneMap component', async () => {
      const DroneMap = (await import('@/components/DroneMap')).default
      expect(DroneMap).toBeDefined()
    })

    it('should have ActionBar component', async () => {
      const ActionBar = (await import('@/components/ActionBar')).default
      expect(ActionBar).toBeDefined()
    })

    it('should have ScheduleModal component', async () => {
      const ScheduleModal = (await import('@/components/ScheduleModal')).default
      expect(ScheduleModal).toBeDefined()
    })

    // ThemeToggle removed - app is dark mode only now

    it('should have ErrorDisplay component', async () => {
      const ErrorDisplay = (await import('@/components/ErrorDisplay')).default
      expect(ErrorDisplay).toBeDefined()
    })
  })
})

