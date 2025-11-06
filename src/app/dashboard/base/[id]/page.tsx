'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  LinearProgress,
} from '@mui/material'
import {
  LocationOn,
  Home,
  FlightTakeoff,
  CheckCircle,
  Cancel,
  Schedule,
} from '@mui/icons-material'
import AuthGuard from '@/components/AuthGuard'
import NavigationToolbar from '@/components/NavigationToolbar'
import { useAppStore } from '@/lib/store'
import { mockBases, mockDrones, getDroneBattery, getLocationName } from '@/lib/mockData'

function BaseDashboardContentInner() {
  const params = useParams()
  const router = useRouter()
  const baseId = params.id as string
  const { bases, drones, schedules, setSelectedBase, setSelectedDrone } = useAppStore()
  const [isLoading, setIsLoading] = useState(true)

  // Initialize with mock data
  useEffect(() => {
    if (bases.length === 0) {
      useAppStore.getState().setBases(mockBases)
      useAppStore.getState().setDrones(mockDrones)
    }
    setIsLoading(false)
  }, [bases.length])

  const base = bases.find((b) => b.id === baseId) || mockBases.find((b) => b.id === baseId)
  const assignedDrones = drones.filter((d) => d.base_id === baseId)
  
  // Base is considered "up" if it exists (mock: all bases are up)
  const isBaseUp = base !== undefined
  
  // Drones are considered "connected" if their status is active or patrolling
  const connectedDrones = assignedDrones.filter(
    (d) => d.status === 'active' || d.status === 'patrolling'
  )
  
  // Schedules for drones at this base
  const baseSchedules = schedules.filter((s) => {
    const drone = drones.find((d) => d.id === s.drone_id)
    return drone?.base_id === baseId
  })

  const getBatteryIcon = (battery: number) => {
    if (battery >= 80) return '🟢'
    if (battery >= 60) return '🟡'
    if (battery >= 40) return '🟠'
    return '🔴'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
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

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!base) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          Base not found
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Base Header */}
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Home sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" fontWeight="bold">
                {base.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <LocationOn sx={{ fontSize: 20, color: 'text.secondary' }} />
                <Typography variant="body1" color="text.secondary">
                  {getLocationName(base)}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isBaseUp ? (
                <>
                  <CheckCircle sx={{ color: 'success.main' }} />
                  <Typography variant="body1" color="success.main" fontWeight="medium">
                    Base Up
                  </Typography>
                </>
              ) : (
                <>
                  <Cancel sx={{ color: 'error.main' }} />
                  <Typography variant="body1" color="error.main" fontWeight="medium">
                    Base Down
                  </Typography>
                </>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Coordinates:</strong> {base.lat.toFixed(6)}, {base.lng.toFixed(6)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Total Drones:</strong> {assignedDrones.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Connected:</strong> {connectedDrones.length}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Connected Drones Status */}
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Connection Status
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Card variant="outlined" sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {connectedDrones.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Connected Drones
              </Typography>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="text.secondary">
                {assignedDrones.length - connectedDrones.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Not Connected
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Paper>

      {/* Assigned Drones List */}
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Assigned Drones ({assignedDrones.length})
        </Typography>

        {assignedDrones.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Drone Name</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Battery</TableCell>
                  <TableCell>Connection</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignedDrones.map((drone) => {
                  const battery = getDroneBattery(drone.id)
                  const isConnected = drone.status === 'active' || drone.status === 'patrolling'
                  
                  return (
                    <TableRow 
                      key={drone.id}
                      onClick={() => {
                        setSelectedDrone(drone)
                        router.push(`/dashboard?drone=${drone.id}`)
                      }}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { 
                          bgcolor: 'action.hover',
                          transform: 'scale(1.01)',
                          transition: 'all 0.2s ease-in-out',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      <TableCell>
                        <Typography fontWeight="medium">{drone.name}</Typography>
                      </TableCell>
                      <TableCell>{drone.model || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={drone.status}
                          size="small"
                          color={getStatusColor(drone.status) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 150 }}>
                          <Typography variant="body2">{getBatteryIcon(battery)}</Typography>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="caption">{battery}%</Typography>
                            <LinearProgress
                              variant="determinate"
                              value={battery}
                              sx={{ height: 4, borderRadius: 1 }}
                              color={battery >= 60 ? 'success' : battery >= 20 ? 'warning' : 'error'}
                            />
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {isConnected ? (
                          <Chip icon={<CheckCircle />} label="Connected" size="small" color="success" />
                        ) : (
                          <Chip icon={<Cancel />} label="Not Connected" size="small" color="default" />
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 4,
            }}
          >
            <FlightTakeoff sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No drones assigned to this base
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Schedules Section */}
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          <Schedule sx={{ verticalAlign: 'middle', mr: 1 }} />
          Schedules ({baseSchedules.length})
        </Typography>

        {baseSchedules.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Drone</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>End Time</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {baseSchedules.map((schedule) => {
                  const drone = drones.find((d) => d.id === schedule.drone_id)
                  return (
                    <TableRow key={schedule.id}>
                      <TableCell>{drone?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        {new Date(schedule.start_time).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {schedule.end_time ? new Date(schedule.end_time).toLocaleString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip label="Scheduled" size="small" color="info" />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 4,
            }}
          >
            <Schedule sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No schedules for this base
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  )
}

function BaseDashboardContent() {
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    }>
      <BaseDashboardContentInner />
    </Suspense>
  )
}

export default function BaseDashboardPage() {
  return (
    <AuthGuard>
      <NavigationToolbar showBack />
      <BaseDashboardContent />
    </AuthGuard>
  )
}

