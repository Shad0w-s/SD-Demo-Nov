'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  Box,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
} from '@mui/material'
import { Close } from '@mui/icons-material'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { ApiError } from '@/lib/api'
import { mockScheduleIds } from '@/lib/mockData'

export default function Sidebar() {
  const pathname = usePathname()
  const isDashboard = pathname === '/dashboard'
  const {
    drones,
    schedules,
    selectedDrone,
    setSelectedDrone,
    isLoading,
    setError,
    removeSchedule,
  } = useAppStore()

  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Sidebar now only reads from store - no blocking API calls
  // Data is loaded by Dashboard component in background

  async function handleDroneSelect(e: any) {
    const droneId = e.target.value
    if (!droneId) {
      setSelectedDrone(null)
      return
    }

    const drone = drones.find((d) => d.id === droneId)
    setSelectedDrone(drone || null)
  }

  async function handleDeleteSchedule(scheduleId: string) {
    const isMockSchedule = mockScheduleIds.has(scheduleId)

    if (isMockSchedule) {
      removeSchedule(scheduleId)
      return
    }

    try {
      setDeletingId(scheduleId)
      await api.deleteSchedule(scheduleId)
      removeSchedule(scheduleId)
    } catch (error) {
      console.error('Failed to delete schedule', error)
      let errorMessage = 'Failed to delete schedule'

      if (error && typeof error === 'object') {
        const apiError = error as ApiError
        if (apiError?.message) {
          errorMessage = apiError.message
        } else if ('detail' in apiError && (apiError as any).detail) {
          errorMessage = (apiError as any).detail
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      setError(errorMessage)
    } finally {
      setDeletingId(null)
    }
  }



  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'charging':
        return 'info'
      case 'not charging':
        return 'default'
      case 'active':
        return 'success'
      case 'patrolling':
        return 'warning'
      default:
        return 'default'
    }
  }

  return (
    <Paper
      elevation={3}
      sx={{
        width: 320,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 0,
        borderRight: 1,
        borderColor: 'divider',
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            Drone Control
          </Typography>
        </Box>

        {!isDashboard && (
          <FormControl fullWidth size="small">
            <InputLabel>Select Drone</InputLabel>
            <Select
              value={selectedDrone?.id || ''}
              onChange={handleDroneSelect}
              disabled={isLoading}
              label="Select Drone"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {drones.map((drone) => (
                <MenuItem key={drone.id} value={drone.id}>
                  {drone.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {selectedDrone && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            {selectedDrone.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
            <Chip label={selectedDrone.status} size="small" color={getStatusColor(selectedDrone.status)} />
            {selectedDrone.model && (
              <Typography variant="caption" color="text.secondary">
                {selectedDrone.model}
              </Typography>
            )}
          </Box>
        </Box>
      )}

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Scheduled Routes
        </Typography>
        {schedules.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No scheduled flights
          </Typography>
        ) : (
          <List dense>
            {schedules
              .filter((s) => !selectedDrone || s.drone_id === selectedDrone.id)
              .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
              .map((schedule) => {
                const startTime = new Date(schedule.start_time)
                const endTime = schedule.end_time ? new Date(schedule.end_time) : null
                const duration = endTime 
                  ? Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))
                  : null
                const hasRoute = schedule.path_json?.coordinates && schedule.path_json.coordinates.length >= 2
                const waypointCount = schedule.path_json?.coordinates?.length || 0
                
                return (
                  <ListItem
                    key={schedule.id}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      bgcolor: 'action.hover',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                    >
                      <Box
                        sx={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1,
                        }}
                      >
                        <ListItemText
                          sx={{ flex: 1, minWidth: 0 }}
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" fontWeight="bold">
                                {startTime.toLocaleDateString()} {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                              {duration && (
                                <Chip label={`${duration} min`} size="small" color="primary" />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {hasRoute ? `Route: ${waypointCount} waypoints` : 'Default patrol route'}
                              </Typography>
                              {endTime && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Ends: {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <IconButton
                          size="small"
                          aria-label="Delete schedule"
                          title="Delete schedule"
                          disableRipple
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            handleDeleteSchedule(schedule.id)
                          }}
                          disabled={deletingId === schedule.id}
                          sx={{
                            color: 'text.disabled',
                            transition: (theme) => theme.transitions.create(['color']),
                            '&:hover': {
                              color: 'error.main',
                              backgroundColor: 'transparent',
                            },
                            '&.Mui-disabled': {
                              color: 'text.disabled',
                            },
                          }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItem>
                )
              })}
          </List>
        )}
      </Box>
    </Paper>
  )
}
