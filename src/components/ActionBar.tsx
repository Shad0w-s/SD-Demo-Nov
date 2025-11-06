'use client'

import { useState } from 'react'
import { Box, Paper, Button, Stack } from '@mui/material'
import {
  Edit,
  CalendarToday,
  PlayArrow,
  Stop,
} from '@mui/icons-material'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
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
    simulation,
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
      // Clear path when stopping drawing
      setCurrentPath(null)
      // Clear path on map will be handled by DroneMap cleanup
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

  async function handleStopSimulation() {
    setSimulation({
      isRunning: false,
      speed: undefined,
      eta: undefined,
      telemetry: undefined,
    })
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
          {simulation?.isRunning ? (
            <Button
              variant="contained"
              color="error"
              startIcon={<Stop />}
              onClick={handleStopSimulation}
              disabled={!selectedDrone}
            >
              Stop Simulation
            </Button>
          ) : (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<PlayArrow />}
              onClick={handleStartSimulation}
              disabled={!selectedDrone || !currentPath}
            >
              Start Simulation
            </Button>
          )}
        </Stack>
      </Paper>

      <ScheduleModal isOpen={isScheduleOpen} onClose={() => setIsScheduleOpen(false)} />
    </>
  )
}
