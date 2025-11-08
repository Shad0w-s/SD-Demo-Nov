import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '@/lib/store'
import { mockSchedules } from '@/lib/mockData'

describe('Schedule merging behavior', () => {
  beforeEach(() => {
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

  it('merges API schedules over mock schedules without duplicating IDs', () => {
    const store = useAppStore.getState()
    store.setSchedules(mockSchedules)

    const apiSchedules = [
      {
        ...mockSchedules[0],
        path_json: { coordinates: [[-90, 45], [-89, 46]] },
      },
      {
        id: 'api-only-schedule',
        drone_id: 'a1b2c3d4-1111-1111-1111-000000000001',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
        path_json: { coordinates: [[-120, 35], [-121, 36]] },
        created_at: new Date().toISOString(),
      },
    ]

    store.mergeSchedules(apiSchedules)

    const merged = useAppStore.getState().schedules
    expect(merged.length).toBe(mockSchedules.length + 1)

    const replacedSchedule = merged.find((schedule) => schedule.id === mockSchedules[0].id)
    expect(replacedSchedule?.path_json).toEqual(apiSchedules[0].path_json)

    const newSchedule = merged.find((schedule) => schedule.id === 'api-only-schedule')
    expect(newSchedule).toBeDefined()
  })

  it('retains preloaded mock schedules when API returns no data', () => {
    const store = useAppStore.getState()
    store.setSchedules(mockSchedules)

    store.mergeSchedules([])

    const merged = useAppStore.getState().schedules
    expect(merged).toHaveLength(mockSchedules.length)
    expect(merged).toEqual(mockSchedules)
  })
})


