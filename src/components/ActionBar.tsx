'use client'

import { useState } from 'react'
import { Box, Paper, Button, Stack, Tooltip } from '@mui/material'
import {
  Edit,
  CalendarToday,
  PlayArrow,
  FlightLand,
  Warning,
  Cancel,
  Stop,
  Pause,
} from '@mui/icons-material'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { ApiError } from '@/lib/api'
import ScheduleModal from './ScheduleModal'
import ConfirmationDialog from './ConfirmationDialog'

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
  const [confirmationDialog, setConfirmationDialog] = useState<{
    open: boolean
    title: string
    message: string
  }>({ open: false, title: '', message: '' })

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

  async function handleAction(action: string) {
    if (!selectedDrone) {
      setError('Please select a drone first')
      return
    }

    try {
      setIsLoading(true)
      
      // For demo: just update status and show confirmation
      if (action === 'return_to_base') {
        const { updateDrone, setSelectedDrone } = useAppStore.getState()
        updateDrone(selectedDrone.id, { status: 'charging' })
        setSelectedDrone({ ...selectedDrone, status: 'charging' })
        setConfirmationDialog({
          open: true,
          title: 'Drone Returned to Base',
          message: 'Drone returned to base and is now charging.',
        })
      } else if (action === 'end_early') {
        const { updateDrone, setSelectedDrone } = useAppStore.getState()
        updateDrone(selectedDrone.id, { status: 'not charging' })
        setSelectedDrone({ ...selectedDrone, status: 'not charging' })
        setConfirmationDialog({
          open: true,
          title: 'Flight Ended Early',
          message: 'Flight ended early. Drone status set to not charging.',
        })
      } else {
        // For other actions, try API call
        await api.droneAction(selectedDrone.id, action)
        const updatedDrone = await api.getDrone(selectedDrone.id)
        const { updateDrone, setSelectedDrone } = useAppStore.getState()
        updateDrone(selectedDrone.id, updatedDrone)
        setSelectedDrone(updatedDrone)
      }
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
          {simulation?.isRunning ? (
            <>
              <Button
                variant="contained"
                color="error"
                startIcon={<Stop />}
                onClick={handleStopSimulation}
                disabled={!selectedDrone}
              >
                Stop Simulation
              </Button>
            </>
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
          <Button
            variant="outlined"
            color="error"
            startIcon={<FlightLand />}
            onClick={() => handleAction('return_to_base')}
            disabled={!selectedDrone}
          >
            Return to Base
          </Button>
          <Tooltip title="Camera feed not available in demo">
            <span>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<Warning />}
                onClick={() => handleAction('intercept')}
                disabled={true}
              >
                Intercept
              </Button>
            </span>
          </Tooltip>
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
      <ConfirmationDialog
        open={confirmationDialog.open}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        onClose={() => setConfirmationDialog({ open: false, title: '', message: '' })}
      />
    </>
  )
}
