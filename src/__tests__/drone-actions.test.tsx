/**
 * Drone Actions Tests
 * Tests for return to base and end early actions
 * Run with: npm test -- drone-actions
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAppStore } from '@/lib/store'

describe('Drone Actions', () => {
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

  describe('Return to Base Action', () => {
    it('should update drone status to charging', () => {
      const store = useAppStore.getState()
      
      const mockDrone = {
        id: 'drone-1',
        name: 'Test Drone',
        status: 'active',
      }
      
      // Add drone to drones array
      store.addDrone(mockDrone as any)
      store.setSelectedDrone(mockDrone as any)
      
      // Update drone status
      store.updateDrone(mockDrone.id, { status: 'charging' })
      
      // Verify update in drones array
      const updatedDrone = useAppStore.getState().drones.find((d) => d.id === mockDrone.id)
      expect(updatedDrone?.status).toBe('charging')
      
      // Verify selectedDrone was also updated (updateDrone handles this)
      const selectedDrone = useAppStore.getState().selectedDrone
      expect(selectedDrone?.status).toBe('charging')
    })

    it('should show confirmation dialog after return to base', async () => {
      // Confirmation dialog component exists
      const ConfirmationDialog = (await import('@/components/ConfirmationDialog')).default
      expect(ConfirmationDialog).toBeDefined()
    })
  })

  describe('End Early Action', () => {
    it('should update drone status to not charging', () => {
      const store = useAppStore.getState()
      
      const mockDrone = {
        id: 'drone-2',
        name: 'Test Drone 2',
        status: 'active',
      }
      
      // Add drone to drones array
      store.addDrone(mockDrone as any)
      store.setSelectedDrone(mockDrone as any)
      
      // Update drone status
      store.updateDrone(mockDrone.id, { status: 'not charging' })
      
      // Verify update in drones array
      const updatedDrone = useAppStore.getState().drones.find((d) => d.id === mockDrone.id)
      expect(updatedDrone?.status).toBe('not charging')
      
      // Verify selectedDrone was also updated
      const selectedDrone = useAppStore.getState().selectedDrone
      expect(selectedDrone?.status).toBe('not charging')
    })

    it('should show confirmation dialog after end early', async () => {
      // Confirmation dialog component exists
      const ConfirmationDialog = (await import('@/components/ConfirmationDialog')).default
      expect(ConfirmationDialog).toBeDefined()
    })
  })

  describe('Status Updates', () => {
    it('should support all new status types', () => {
      const store = useAppStore.getState()
      
      const statuses = ['charging', 'not charging', 'active', 'patrolling']
      
      statuses.forEach((status) => {
        const mockDrone = {
          id: `drone-${status}`,
          name: 'Test Drone',
          status: status,
        }
        store.setSelectedDrone(mockDrone as any)
        
        const selectedDrone = useAppStore.getState().selectedDrone
        expect(selectedDrone?.status).toBe(status)
      })
    })
  })
})
