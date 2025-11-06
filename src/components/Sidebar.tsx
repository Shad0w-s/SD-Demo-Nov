'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  Box,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material'
import { FlightTakeoff, FlightLand, Warning, Cancel } from '@mui/icons-material'
import { useAppStore, Drone } from '@/lib/store'
import { api } from '@/lib/api'
import { ApiError } from '@/lib/api'

export default function Sidebar() {
  const pathname = usePathname()
  const isDashboard = pathname === '/dashboard'
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
      const updated = updatedDrones.find((drone: Drone) => drone.id === selectedDrone.id)
      if (updated) setSelectedDrone(updated)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Action failed')
    } finally {
      setIsLoading(false)
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
          Schedule
        </Typography>
        {schedules.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No scheduled flights
          </Typography>
        ) : (
          <List dense>
            {schedules
              .filter((s) => !selectedDrone || s.drone_id === selectedDrone.id)
              .map((schedule) => (
                <ListItem
                  key={schedule.id}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    bgcolor: 'action.hover',
                  }}
                >
                  <ListItemText
                    primary={new Date(schedule.start_time).toLocaleDateString()}
                    secondary={new Date(schedule.start_time).toLocaleTimeString()}
                  />
                </ListItem>
              ))}
          </List>
        )}
      </Box>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            variant="contained"
            color="error"
            startIcon={<FlightLand />}
            onClick={() => handleQuickAction('return_to_base')}
            disabled={!selectedDrone || isLoading}
            fullWidth
            size="small"
          >
            Return to Base
          </Button>
          <Button
            variant="contained"
            color="warning"
            startIcon={<Warning />}
            onClick={() => handleQuickAction('intercept')}
            disabled={!selectedDrone || isLoading}
            fullWidth
            size="small"
          >
            Intercept
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<Cancel />}
            onClick={() => handleQuickAction('end_early')}
            disabled={!selectedDrone || isLoading}
            fullWidth
            size="small"
          >
            End Early
          </Button>
        </Box>
      </Box>
    </Paper>
  )
}
