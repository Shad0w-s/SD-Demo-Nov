'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Typography,
  Chip,
} from '@mui/material'
import { Schedule, AccessTime } from '@mui/icons-material'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onDrawingChange?: (drawing: boolean) => void
}

export default function ScheduleModal({ isOpen, onClose, onDrawingChange }: ScheduleModalProps) {
  const { selectedDrone, currentPath, setSchedules, setIsLoading, setError, setCurrentPath } = useAppStore()
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('60') // Default 60 minutes
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const now = new Date()
      now.setHours(now.getHours() + 1)
      setDate(now.toISOString().slice(0, 10))
      setTime(now.toISOString().slice(11, 16))
      setDuration('60')
    }
  }, [isOpen])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!date || !time) {
      setError('Date and time are required')
      return
    }

    if (!selectedDrone) {
      setError('Please select a drone first')
      return
    }

    // Validate that at least one waypoint is placed
    if (!currentPath || currentPath.length < 1) {
      setError('Please place at least one waypoint before scheduling')
      return
    }

    try {
      setIsSubmitting(true)
      setIsLoading(true)

      // Combine date and time
      const startDateTime = new Date(`${date}T${time}`)
      const durationMinutes = parseInt(duration) || 60
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000)

      // Use current path (required - validated above)
      const scheduleData = {
        drone_id: selectedDrone.id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        path_json: { coordinates: currentPath }, // Always include path since waypoints are required
      }

      // Log schedule parameters to console BEFORE API call
      console.log('=== Schedule Flight Parameters ===')
      console.log('Drone ID:', scheduleData.drone_id)
      console.log('Start Time:', scheduleData.start_time)
      console.log('End Time:', scheduleData.end_time)
      console.log('Duration (minutes):', durationMinutes)
      console.log('Path JSON:', scheduleData.path_json)
      if (currentPath && currentPath.length >= 1) {
        console.log('Waypoints:', currentPath)
        console.log('Waypoint Count:', currentPath.length)
      }
      console.log('Full Schedule Data:', JSON.stringify(scheduleData, null, 2))
      console.log('===================================')

      // Log schedule creation details
      console.log('✅ Schedule Created Successfully')
      console.log('=== Schedule Details ===')
      console.log(`Drone: ${selectedDrone.name} (${scheduleData.drone_id})`)
      console.log(`Start Time: ${scheduleData.start_time}`)
      console.log(`End Time: ${scheduleData.end_time}`)
      console.log(`Duration: ${durationMinutes} minutes`)
      if (currentPath && currentPath.length >= 1) {
        console.log(`Waypoints: ${currentPath.length} waypoints`)
        currentPath.forEach((wp, index) => {
          console.log(`  Waypoint ${index + 1}: [${wp[0]}, ${wp[1]}] (Lng: ${wp[0]}, Lat: ${wp[1]})`)
        })
      }
      console.log('========================')

      // Create schedule in database
      await api.createSchedule(scheduleData)
      const schedules = await api.getSchedules()
      setSchedules(schedules)

      // Clear waypoints and exit drawing mode after successful schedule creation
      setCurrentPath(null)
      if (onDrawingChange) {
        onDrawingChange(false)
      }

      onClose()
      setDate('')
      setTime('')
      setDuration('60')
    } catch (error) {
      // Enhanced error logging
      console.error('❌ Schedule submission error:', error)
      console.error('Error type:', error?.constructor?.name)
      console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error || {}), 2))
      
      // Try to extract meaningful error message
      let errorMessage = 'Failed to create schedule'
      
      if (error && typeof error === 'object') {
        // Check for ApiError structure
        if ('message' in error) {
          errorMessage = (error as any).message
        } else if ('detail' in error) {
          errorMessage = (error as any).detail
        } else if ('error' in error) {
          errorMessage = (error as any).error
        } else if (error instanceof Error) {
          errorMessage = error.message
        } else {
          // Try to stringify the error object
          try {
            const errorStr = JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
            errorMessage = errorStr.length > 200 ? errorStr.substring(0, 200) + '...' : errorStr
          } catch {
            errorMessage = String(error)
          }
        }
        
        // Log status code if available
        if ('status' in error) {
          console.error('HTTP Status:', (error as any).status)
          if ((error as any).status === 403) {
            errorMessage = 'Access denied. Please check your authentication or CORS configuration.'
          } else if ((error as any).status === 401) {
            errorMessage = 'Authentication required. Please log in again.'
          } else if ((error as any).status === 0 || (error as any).status === undefined) {
            errorMessage = 'Network error. Please check if the backend server is running.'
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      } else {
        errorMessage = String(error)
      }
      
      console.error('Final error message:', errorMessage)
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Schedule />
            Schedule Flight
          </Box>
        </DialogTitle>
        <DialogContent>
          {!selectedDrone && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Please select a drone first
            </Alert>
          )}
          {selectedDrone && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Drone
              </Typography>
              <Chip label={selectedDrone.name} size="small" />
            </Box>
          )}
          {currentPath && currentPath.length >= 1 && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Route with {currentPath.length} waypoint{currentPath.length !== 1 ? 's' : ''} will be used
            </Alert>
          )}
          {(!currentPath || currentPath.length < 1) && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Please place at least one waypoint on the map before scheduling
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              disabled={!selectedDrone || isSubmitting}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                min: new Date().toISOString().slice(0, 10),
              }}
            />
            <TextField
              label="Time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              disabled={!selectedDrone || isSubmitting}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              label="Duration (minutes)"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
              disabled={!selectedDrone || isSubmitting}
              fullWidth
              inputProps={{
                min: 15,
                max: 480,
                step: 15,
              }}
              helperText="Flight duration in minutes (15-480)"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!selectedDrone || !date || !time || isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : <AccessTime />}
          >
            {isSubmitting ? 'Scheduling...' : 'Schedule Flight'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
