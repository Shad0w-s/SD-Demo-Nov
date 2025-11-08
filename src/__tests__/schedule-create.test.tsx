import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import ScheduleModal from '@/components/ScheduleModal'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api')
  return {
    ...actual,
    api: {
      ...actual.api,
      createSchedule: vi.fn(),
      getSchedules: vi.fn(),
    },
  }
})

describe('Schedule creation modal - optimistic updates', () => {
  const createScheduleMock = api.createSchedule as unknown as ReturnType<typeof vi.fn>
  const getSchedulesMock = api.getSchedules as unknown as ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    useAppStore.setState({
      drones: [],
      bases: [],
      schedules: [],
      selectedDrone: {
        id: 'drone-optimistic',
        name: 'Optimistic Drone',
        status: 'active',
      },
      selectedBase: null,
      currentPath: [
        [-122.4194, 37.7749],
        [-122.4094, 37.7849],
      ],
      simulation: null,
      isLoading: false,
      error: null,
    })
  })

  afterEach(() => {
    useAppStore.setState({
      schedules: [],
      selectedDrone: null,
      currentPath: null,
      error: null,
    })
  })

  it('adds schedule to store immediately even if refresh fails', async () => {
    const optimisticSchedule = {
      id: 'created-schedule-id',
      drone_id: 'drone-optimistic',
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      path_json: { coordinates: [[-122.4194, 37.7749], [-122.4094, 37.7849]] },
      created_at: new Date().toISOString(),
    }

    createScheduleMock.mockResolvedValueOnce(optimisticSchedule)
    getSchedulesMock.mockRejectedValueOnce(new Error('API refresh failed'))

    const handleClose = vi.fn()
    const { container } = render(<ScheduleModal isOpen onClose={handleClose} />)

    const dateInput = screen.getByLabelText('Date')
    const timeInput = screen.getByLabelText('Time')
    fireEvent.change(dateInput, { target: { value: '2025-01-01' } })
    fireEvent.change(timeInput, { target: { value: '12:00' } })

    const durationField = screen.getByLabelText('Duration (minutes)')
    fireEvent.change(durationField, { target: { value: '45' } })

    const form = container.querySelector('form')
    expect(form).toBeTruthy()
    fireEvent.submit(form as HTMLFormElement)

    await waitFor(() => {
      expect(createScheduleMock).toHaveBeenCalledTimes(1)
    })

    const schedules = useAppStore.getState().schedules
    expect(schedules.find((schedule) => schedule.id === optimisticSchedule.id)).toBeDefined()
    await waitFor(() => {
      expect(getSchedulesMock).toHaveBeenCalledTimes(1)
    })

    expect(handleClose).toHaveBeenCalled()
  })
})


