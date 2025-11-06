'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import {
  ArrowBack,
  LocationOn,
  Home,
  FlightTakeoff,
  Map as MapIcon,
  Battery5Bar,
  Battery4Bar,
  Battery3Bar,
  Battery2Bar,
  Battery1Bar,
  Battery0Bar,
} from '@mui/icons-material'
import AuthGuard from '@/components/AuthGuard'
import NavigationToolbar from '@/components/NavigationToolbar'
import { useAppStore } from '@/lib/store'
import { mockBases, mockDrones, getDroneBattery, getLocationName } from '@/lib/mockData'

export default function BaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const baseId = params.id as string
  const { bases, drones, setSelectedBase, setSelectedDrone } = useAppStore()

  // Initialize with mock data
  useEffect(() => {
    if (bases.length === 0) {
      useAppStore.getState().setBases(mockBases)
      useAppStore.getState().setDrones(mockDrones)
    }
  }, [bases.length])

  const base = bases.find((b) => b.id === baseId) || mockBases.find((b) => b.id === baseId)
  const assignedDrones = drones.filter((d) => d.base_id === baseId)

  if (!base) {
    return (
      <AuthGuard>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" color="error">
            Base not found
          </Typography>
          <Button onClick={() => router.push('/fleet')} sx={{ mt: 2 }}>
            Back to Fleet Overview
          </Button>
        </Box>
      </AuthGuard>
    )
  }

  const handleDroneClick = (droneId: string) => {
    const drone = drones.find((d) => d.id === droneId) || mockDrones.find((d) => d.id === droneId)
    if (drone) {
      setSelectedDrone(drone)
      router.push(`/dashboard?drone=${droneId}`)
    }
  }

  const handleOpenOnMap = () => {
    setSelectedBase(base)
    router.push(`/dashboard?base=${baseId}`)
  }

  const getBatteryIcon = (battery: number) => {
    if (battery >= 80) return <Battery5Bar sx={{ color: 'success.main' }} />
    if (battery >= 60) return <Battery4Bar sx={{ color: 'success.main' }} />
    if (battery >= 40) return <Battery3Bar sx={{ color: 'warning.main' }} />
    if (battery >= 20) return <Battery2Bar sx={{ color: 'warning.main' }} />
    if (battery > 0) return <Battery1Bar sx={{ color: 'error.main' }} />
    return <Battery0Bar sx={{ color: 'error.main' }} />
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

  return (
    <AuthGuard>
      <NavigationToolbar showBack />
      <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
        {/* Base Header */}
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
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
              <Button
                variant="contained"
                startIcon={<MapIcon />}
                onClick={handleOpenOnMap}
                sx={{ minWidth: 150 }}
              >
                Open on Map
              </Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Coordinates:</strong> {base.lat.toFixed(6)}, {base.lng.toFixed(6)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Drones Assigned:</strong> {assignedDrones.length}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Assigned Drones Table */}
        <Paper elevation={3} sx={{ p: 3 }}>
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
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignedDrones.map((drone) => {
                    const battery = getDroneBattery(drone.id)
                    return (
                      <TableRow
                        key={drone.id}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                        onClick={() => handleDroneClick(drone.id)}
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
                            {getBatteryIcon(battery)}
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
                          <Button size="small" onClick={(e) => {
                            e.stopPropagation()
                            handleDroneClick(drone.id)
                          }}>
                            View Details
                          </Button>
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
      </Box>
    </AuthGuard>
  )
}

