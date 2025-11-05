'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { ApiError } from '@/lib/api'
import ScheduleModal from './ScheduleModal'

interface ActionBarProps {
  onDrawingChange?: (drawing: boolean) => void
}

export default function ActionBar({ onDrawingChange }: ActionBarProps) {
  const {
    selectedDrone,
    currentPath,
    setCurrentPath,
    setSimulation,
    setIsLoading,
    setError,
  } = useAppStore()
  
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)

  async function handleDrawPath() {
    if (!selectedDrone) {
      setError('Please select a drone first')
      return
    }
    const newDrawingState = !isDrawing
    setIsDrawing(newDrawingState)
    if (onDrawingChange) {
      onDrawingChange(newDrawingState)
    }
    if (!newDrawingState) {
      // Clear path when exiting drawing mode
      setCurrentPath(null)
    }
  }

  async function handleStartSimulation() {
    if (!selectedDrone) {
      setError('Please select a drone first')
      return
    }

    if (!currentPath || currentPath.length < 2) {
      setError('Please draw a path first')
      return
    }

    try {
      setIsLoading(true)
      const simulationData = await api.simulatePath(selectedDrone.id, {
        path: currentPath,
      })

      setSimulation({
        isRunning: true,
        speed: simulationData.speed_mps,
        eta: simulationData.eta_seconds,
        telemetry: simulationData.telemetry,
      })

      // Animate drone along path (simplified - would use Framer Motion in full implementation)
      console.log('Starting simulation:', simulationData)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Simulation failed')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAction(action: string) {
    if (!selectedDrone) {
      setError('Please select a drone first')
      return
    }

    try {
      setIsLoading(true)
      await api.droneAction(selectedDrone.id, action)
      // Reload data to get updated status
      const updatedDrone = await api.getDrone(selectedDrone.id)
      const { updateDrone, setSelectedDrone } = useAppStore.getState()
      updateDrone(selectedDrone.id, updatedDrone)
      setSelectedDrone(updatedDrone)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Action failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="glass p-4 flex gap-2 justify-center flex-wrap">
        <button
          onClick={handleDrawPath}
          disabled={!selectedDrone}
          className={`px-4 py-2 rounded text-primary text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isDrawing
              ? 'bg-red-500/30 hover:bg-red-500/40 dark:bg-red-500/20 dark:hover:bg-red-500/30'
              : 'bg-blue-500/30 hover:bg-blue-500/40 dark:bg-blue-500/20 dark:hover:bg-blue-500/30'
          }`}
        >
          {isDrawing ? 'Stop Drawing' : 'Draw New Path'}
        </button>
        <button
          onClick={() => setIsScheduleOpen(true)}
          disabled={!selectedDrone}
          className="px-4 py-2 bg-green-500/30 hover:bg-green-500/40 dark:bg-green-500/20 dark:hover:bg-green-500/30 rounded text-primary text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Schedule Flight
        </button>
        <button
          onClick={handleStartSimulation}
          disabled={!selectedDrone || !currentPath}
          className="px-4 py-2 bg-purple-500/30 hover:bg-purple-500/40 dark:bg-purple-500/20 dark:hover:bg-purple-500/30 rounded text-primary text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Simulation
        </button>
        <button
          onClick={() => handleAction('return_to_base')}
          disabled={!selectedDrone}
          className="px-4 py-2 bg-red-500/30 hover:bg-red-500/40 dark:bg-red-500/20 dark:hover:bg-red-500/30 rounded text-primary text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Return to Base
        </button>
        <button
          onClick={() => handleAction('intercept')}
          disabled={!selectedDrone}
          className="px-4 py-2 bg-yellow-500/30 hover:bg-yellow-500/40 dark:bg-yellow-500/20 dark:hover:bg-yellow-500/30 rounded text-primary text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Intercept
        </button>
        <button
          onClick={() => handleAction('end_early')}
          disabled={!selectedDrone}
          className="px-4 py-2 bg-orange-500/30 hover:bg-orange-500/40 dark:bg-orange-500/20 dark:hover:bg-orange-500/30 rounded text-primary text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          End Early
        </button>
      </div>

      <ScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
      />
    </>
  )
}
