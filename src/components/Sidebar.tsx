'use client'

import { useEffect, useState } from 'react'
import LogoutButton from './LogoutButton'
import ThemeToggle from './ThemeToggle'
import { useAppStore, Drone } from '@/lib/store'
import { api } from '@/lib/api'
import { ApiError } from '@/lib/api'

export default function Sidebar() {
  const {
    drones,
    schedules,
    selectedDrone,
    setDrones,
    setSchedules,
    setSelectedDrone,
    setIsLoading,
    setError,
  } = useAppStore()

  const [isLoading, setIsLocalLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLocalLoading(true)
    setIsLoading(true)
    try {
      const [dronesData, schedulesData] = await Promise.all([
        api.getDrones().catch((err: ApiError) => {
          setError(err.message)
          return []
        }),
        api.getSchedules().catch(() => []),
      ])
      setDrones(dronesData || [])
      setSchedules(schedulesData || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load data')
    } finally {
      setIsLocalLoading(false)
      setIsLoading(false)
    }
  }

  async function handleDroneSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const droneId = e.target.value
    if (!droneId) {
      setSelectedDrone(null)
      return
    }

    const drone = drones.find((d) => d.id === droneId)
    setSelectedDrone(drone || null)
  }

  async function handleQuickAction(action: string) {
    if (!selectedDrone) {
      setError('Please select a drone first')
      return
    }

    try {
      setIsLoading(true)
      await api.droneAction(selectedDrone.id, action)
      // Reload drones to get updated status
      const updatedDrones = await api.getDrones()
      setDrones(updatedDrones)
      const updated = updatedDrones.find((d) => d.id === selectedDrone.id)
      if (updated) setSelectedDrone(updated)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Action failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-80 glass p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-primary">Drone Control</h2>
        <div className="flex gap-2">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>

      {/* Drone selector dropdown */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-secondary mb-2">
          Select Drone
        </label>
        <select
          value={selectedDrone?.id || ''}
          onChange={handleDroneSelect}
          disabled={isLoading}
          className="w-full p-2 bg-white/10 dark:bg-black/20 border border-white/30 dark:border-white/10 rounded text-primary text-sm disabled:opacity-50"
        >
          <option value="">Select Drone</option>
          {drones.map((drone: Drone) => (
            <option key={drone.id} value={drone.id}>
              {drone.name} ({drone.status})
            </option>
          ))}
        </select>
      </div>

      {/* Selected drone info */}
      {selectedDrone && (
        <div className="mb-4 glass p-3 rounded-lg">
          <h3 className="text-sm font-semibold text-primary mb-1">
            {selectedDrone.name}
          </h3>
          <p className="text-xs text-secondary">
            Model: {selectedDrone.model || 'N/A'}
          </p>
          <p className="text-xs text-secondary">
            Status: <span className="font-medium">{selectedDrone.status}</span>
          </p>
        </div>
      )}

      {/* Schedule list */}
      <div className="flex-1 mb-4 overflow-y-auto">
        <h3 className="text-sm font-semibold text-secondary mb-2">Schedule</h3>
        <div className="space-y-2">
          {schedules.length === 0 ? (
            <p className="text-xs text-secondary">No scheduled flights</p>
          ) : (
            schedules
              .filter((s) => !selectedDrone || s.drone_id === selectedDrone.id)
              .map((schedule) => (
                <div
                  key={schedule.id}
                  className="glass p-2 rounded text-xs text-secondary"
                >
                  <p className="font-medium text-primary">
                    {new Date(schedule.start_time).toLocaleDateString()}
                  </p>
                  <p className="text-secondary">
                    {new Date(schedule.start_time).toLocaleTimeString()}
                  </p>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Quick action buttons */}
      <div className="space-y-2">
        <button
          onClick={() => handleQuickAction('return_to_base')}
          disabled={!selectedDrone || isLoading}
          className="w-full p-2 bg-red-500/20 hover:bg-red-500/30 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded text-primary text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Return to Base
        </button>
        <button
          onClick={() => handleQuickAction('intercept')}
          disabled={!selectedDrone || isLoading}
          className="w-full p-2 bg-yellow-500/20 hover:bg-yellow-500/30 dark:bg-yellow-500/10 dark:hover:bg-yellow-500/20 rounded text-primary text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Intercept
        </button>
        <button
          onClick={() => handleQuickAction('end_early')}
          disabled={!selectedDrone || isLoading}
          className="w-full p-2 bg-orange-500/20 hover:bg-orange-500/30 dark:bg-orange-500/10 dark:hover:bg-orange-500/20 rounded text-primary text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          End Early
        </button>
      </div>
    </div>
  )
}
