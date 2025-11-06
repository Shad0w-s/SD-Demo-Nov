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
}

export default function ScheduleModal({ isOpen, onClose }: ScheduleModalProps) {
  const { selectedDrone, currentPath, setSchedules, setIsLoading, setError } = useAppStore()
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

    try {
      setIsSubmitting(true)
      setIsLoading(true)

      // Combine date and time
      const startDateTime = new Date(`${date}T${time}`)
      const durationMinutes = parseInt(duration) || 60
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000)

      // Use current path if available, otherwise use empty path (will use default route)
      const scheduleData = {
        drone_id: selectedDrone.id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        path_json: currentPath && currentPath.length >= 2 
          ? { coordinates: currentPath } 
          : undefined, // Optional path - will use default patrol route if not provided
      }

      await api.createSchedule(scheduleData)

      const schedules = await api.getSchedules()
      setSchedules(schedules)

      onClose()
      setDate('')
      setTime('')
      setDuration('60')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create schedule')
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
          {currentPath && currentPath.length >= 2 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Custom route with {currentPath.length} waypoints will be used
            </Alert>
          )}
          {(!currentPath || currentPath.length < 2) && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Default patrol route will be used (you can draw a custom path on the map if needed)
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
