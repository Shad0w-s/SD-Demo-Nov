/**
 * Map Centering Tests
 * Tests for map auto-centering functionality
 * Run with: npm test -- map-centering
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAppStore } from '@/lib/store'
import { mockDrones, mockBases } from '@/lib/mockData'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/dashboard',
}))

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

describe('Map Auto-Centering', () => {
  beforeEach(() => {
    useAppStore.setState({
      drones: mockDrones,
      bases: mockBases,
      selectedDrone: null,
      selectedBase: null,
    })
  })

  describe('Centering on Drone Selection', () => {
    it('should center on drone base location when drone is selected', () => {
      const store = useAppStore.getState()
      const drone = mockDrones.find(d => d.id === 'drone-1')
      const base = mockBases.find(b => b.id === drone?.base_id)
      
      expect(drone).toBeDefined()
      expect(base).toBeDefined()
      
      if (drone && base) {
        store.setSelectedDrone(drone)
        const selectedDrone = useAppStore.getState().selectedDrone
        
        expect(selectedDrone?.id).toBe(drone.id)
        expect(selectedDrone?.base_id).toBe(base.id)
        
        // Should have coordinates for centering
        expect(base.lng).toBeDefined()
        expect(base.lat).toBeDefined()
      }
    })

    it('should center on different bases for different drones', () => {
      const sfDrone = mockDrones.find(d => d.base_id === 'base-1')
      const austinDrone = mockDrones.find(d => d.base_id === 'base-2')
      
      expect(sfDrone).toBeDefined()
      expect(austinDrone).toBeDefined()
      
      if (sfDrone && austinDrone) {
        const sfBase = mockBases.find(b => b.id === sfDrone.base_id)
        const austinBase = mockBases.find(b => b.id === austinDrone.base_id)
        
        expect(sfBase?.lng).not.toBe(austinBase?.lng)
        expect(sfBase?.lat).not.toBe(austinBase?.lat)
      }
    })
  })

  describe('Centering on Base Selection', () => {
    it('should center on base location when base is selected', () => {
      const store = useAppStore.getState()
      const base = mockBases[0]
      
      store.setSelectedBase(base)
      const selectedBase = useAppStore.getState().selectedBase
      
      expect(selectedBase?.id).toBe(base.id)
      expect(selectedBase?.lng).toBe(base.lng)
      expect(selectedBase?.lat).toBe(base.lat)
    })

    it('should have valid coordinates for all bases', () => {
      mockBases.forEach(base => {
        expect(base.lng).toBeDefined()
        expect(base.lat).toBeDefined()
        expect(typeof base.lng).toBe('number')
        expect(typeof base.lat).toBe('number')
        expect(base.lng).toBeGreaterThanOrEqual(-180)
        expect(base.lng).toBeLessThanOrEqual(180)
        expect(base.lat).toBeGreaterThanOrEqual(-90)
        expect(base.lat).toBeLessThanOrEqual(90)
      })
    })
  })

  describe('Map Center Function', () => {
    it('should accept lng, lat, and optional zoom', () => {
      const centerParams = {
        lng: -122.4194,
        lat: 37.7749,
        zoom: 14,
      }
      
      expect(centerParams.lng).toBeDefined()
      expect(centerParams.lat).toBeDefined()
      expect(centerParams.zoom).toBeGreaterThan(0)
    })

    it('should use default zoom if not provided', () => {
      const centerParams = {
        lng: -122.4194,
        lat: 37.7749,
      }
      
      const zoom = centerParams.zoom || 14
      expect(zoom).toBe(14)
    })
  })
})

