'use client'

import { useState } from 'react'
import { Box, Paper, Button, Stack } from '@mui/material'
import {
  Edit,
  CalendarToday,
  PlayArrow,
  FlightLand,
  Warning,
  Cancel,
} from '@mui/icons-material'
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
      <Paper
        elevation={3}
        sx={{
          p: 2,
          borderRadius: 0,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
          <Button
            variant={isDrawing ? 'contained' : 'outlined'}
            color={isDrawing ? 'error' : 'primary'}
            startIcon={<Edit />}
            onClick={handleDrawPath}
            disabled={!selectedDrone}
          >
            {isDrawing ? 'Stop Drawing' : 'Draw Path'}
          </Button>
          <Button
            variant="outlined"
            color="success"
            startIcon={<CalendarToday />}
            onClick={() => setIsScheduleOpen(true)}
            disabled={!selectedDrone}
          >
            Schedule Flight
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<PlayArrow />}
            onClick={handleStartSimulation}
            disabled={!selectedDrone || !currentPath}
          >
            Start Simulation
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<FlightLand />}
            onClick={() => handleAction('return_to_base')}
            disabled={!selectedDrone}
          >
            Return to Base
          </Button>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<Warning />}
            onClick={() => handleAction('intercept')}
            disabled={!selectedDrone}
          >
            Intercept
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Cancel />}
            onClick={() => handleAction('end_early')}
            disabled={!selectedDrone}
          >
            End Early
          </Button>
        </Stack>
      </Paper>

      <ScheduleModal isOpen={isScheduleOpen} onClose={() => setIsScheduleOpen(false)} />
    </>
  )
}
