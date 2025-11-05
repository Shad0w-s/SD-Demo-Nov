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
} from '@mui/material'
import { Schedule } from '@mui/icons-material'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { ApiError } from '@/lib/api'

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ScheduleModal({ isOpen, onClose }: ScheduleModalProps) {
  const { selectedDrone, currentPath, setSchedules, setIsLoading, setError } = useAppStore()
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const now = new Date()
      now.setHours(now.getHours() + 1)
      setStartTime(now.toISOString().slice(0, 16))
      setEndTime('')
    }
  }, [isOpen])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedDrone) {
      setError('Please select a drone first')
      return
    }

    if (!startTime) {
      setError('Start time is required')
      return
    }

    try {
      setIsSubmitting(true)
      setIsLoading(true)

      const scheduleData = {
        drone_id: selectedDrone.id,
        start_time: new Date(startTime).toISOString(),
        end_time: endTime ? new Date(endTime).toISOString() : undefined,
        path_json: currentPath ? { coordinates: currentPath } : undefined,
      }

      await api.createSchedule(scheduleData)

      const schedules = await api.getSchedules()
      setSchedules(schedules)

      onClose()
      setStartTime('')
      setEndTime('')
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Start Time"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              disabled={!selectedDrone || isSubmitting}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              label="End Time (Optional)"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={!selectedDrone || isSubmitting}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                min: startTime,
              }}
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
            disabled={!selectedDrone || isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
          >
            {isSubmitting ? 'Scheduling...' : 'Schedule Flight'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
