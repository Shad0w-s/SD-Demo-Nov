import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Sidebar from '@/components/Sidebar'
import { useAppStore } from '@/lib/store'
import { mockSchedules } from '@/lib/mockData'
import { api } from '@/lib/api'

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}))

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api')
  return {
    ...actual,
    api: {
      ...actual.api,
      deleteSchedule: vi.fn(),
    },
  }
})

describe('Sidebar schedule deletion', () => {
  const deleteScheduleMock = api.deleteSchedule as unknown as ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    useAppStore.setState({
      drones: [],
      bases: [],
      schedules: [],
      selectedDrone: null,
      selectedBase: null,
      currentPath: null,
      simulation: null,
      isLoading: false,
      error: null,
    })
  })

  afterEach(() => {
    useAppStore.setState({
      schedules: [],
      selectedDrone: null,
      error: null,
    })
  })

  it('removes mock schedules locally without calling API', () => {
    const mockSchedule = {
      ...mockSchedules[0],
      start_time: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    }

    useAppStore.setState({
      schedules: [mockSchedule],
    })

    render(<Sidebar />)

    const deleteButton = screen.getByLabelText('Delete schedule')
    fireEvent.click(deleteButton)

    const schedules = useAppStore.getState().schedules
    expect(schedules).toHaveLength(0)
    expect(deleteScheduleMock).not.toHaveBeenCalled()
  })

  it('calls API and removes schedule when deleting persisted entry', async () => {
    const persistedSchedule = {
      id: 'persisted-schedule',
      drone_id: 'db-drone',
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      path_json: { coordinates: [[-120, 35], [-121, 36]] },
      created_at: new Date().toISOString(),
    }

    deleteScheduleMock.mockResolvedValueOnce({})

    useAppStore.setState({
      schedules: [persistedSchedule],
    })

    render(<Sidebar />)

    const deleteButton = screen.getByLabelText('Delete schedule')
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(deleteScheduleMock).toHaveBeenCalledWith(persistedSchedule.id)
    })

    const schedules = useAppStore.getState().schedules
    expect(schedules).toHaveLength(0)
  })

  it('keeps schedule and sets error if API deletion fails', async () => {
    const failingSchedule = {
      id: 'failing-schedule',
      drone_id: 'db-drone',
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      path_json: { coordinates: [[-100, 30], [-100.5, 30.5]] },
      created_at: new Date().toISOString(),
    }

    deleteScheduleMock.mockRejectedValueOnce(new Error('Delete failed'))

    useAppStore.setState({
      schedules: [failingSchedule],
    })

    render(<Sidebar />)

    const deleteButton = screen.getByLabelText('Delete schedule')
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(deleteScheduleMock).toHaveBeenCalledWith(failingSchedule.id)
    })

    const { schedules, error } = useAppStore.getState()
    expect(schedules).toHaveLength(1)
    expect(error).toBe('Failed to delete schedule')
  })
})


