'use client'

import { useState, useMemo, memo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from '@mui/material'
import {
  Battery5Bar,
  Battery4Bar,
  Battery3Bar,
  Battery2Bar,
  Battery1Bar,
  Battery0Bar,
  LocationOn,
  FlightTakeoff,
  Home,
} from '@mui/icons-material'
import { useAppStore, Drone, Base } from '@/lib/store'
import { mockBases, mockDrones, getDroneBattery, getLocationName, formatTimeAgo } from '@/lib/mockData'

interface FleetOverviewProps {
  searchQuery?: string
}

function FleetOverviewComponent({ searchQuery = '' }: FleetOverviewProps) {
  const router = useRouter()
  const { setSelectedDrone, setSelectedBase, setDrones, setBases } = useAppStore()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [baseFilter, setBaseFilter] = useState<string>('all')

  // Initialize with mock data
  useMemo(() => {
    setDrones(mockDrones)
    setBases(mockBases)
  }, [setDrones, setBases])

  const { drones, bases } = useAppStore()

  // Filter drones
  const filteredDrones = useMemo(() => {
    return drones.filter((drone) => {
      const matchesSearch =
        searchQuery === '' ||
        drone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        drone.model?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || drone.status === statusFilter
      const matchesBase = baseFilter === 'all' || drone.base_id === baseFilter
      return matchesSearch && matchesStatus && matchesBase
    })
  }, [drones, searchQuery, statusFilter, baseFilter])

  // Filter bases
  const filteredBases = useMemo(() => {
    return bases.filter((base) => {
      return (
        searchQuery === '' ||
        base.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getLocationName(base).toLowerCase().includes(searchQuery.toLowerCase())
      )
    })
  }, [bases, searchQuery])

  const handleDroneClick = useCallback((drone: Drone) => {
    setSelectedDrone(drone)
    router.push(`/dashboard?drone=${drone.id}`)
  }, [setSelectedDrone, router])

  const handleBaseClick = useCallback((base: Base) => {
    setSelectedBase(base)
    router.push(`/dashboard/base/${base.id}`)
  }, [setSelectedBase, router])

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

  const getDroneBase = (drone: Drone) => {
    return bases.find((b) => b.id === drone.base_id)
  }

  const getBaseDroneCount = (baseId: string) => {
    return drones.filter((d) => d.base_id === baseId).length
  }

  // Calculate fleet statistics
  const fleetStats = useMemo(() => {
    const activeCount = drones.filter((d) => d.status === 'active' || d.status === 'patrolling').length
    const chargingCount = drones.filter((d) => d.status === 'charging').length
    return {
      total: drones.length,
      active: activeCount,
      charging: chargingCount,
      bases: bases.length,
    }
  }, [drones, bases])

  return (
    <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Hero Section with Statistics */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mb: 4,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          color: 'white',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)',
        }}
      >
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Fleet Overview
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
          Manage and monitor your entire drone fleet from one central dashboard
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight="bold">
                {fleetStats.total}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Drones
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight="bold">
                {fleetStats.active}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Active/Patrolling
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight="bold">
                {fleetStats.charging}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Charging
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight="bold">
                {fleetStats.bases}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Bases
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Filters */}
      <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="charging">Charging</MenuItem>
              <MenuItem value="not charging">Not Charging</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="patrolling">Patrolling</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Base</InputLabel>
            <Select value={baseFilter} label="Base" onChange={(e) => setBaseFilter(e.target.value)}>
              <MenuItem value="all">All Bases</MenuItem>
              {bases.map((base) => (
                <MenuItem key={base.id} value={base.id}>
                  {base.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Drones Section */}
      <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
        Drones ({filteredDrones.length})
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {filteredDrones.map((drone) => {
          const battery = getDroneBattery(drone.id)
          const base = getDroneBase(drone)
          const location = base ? getLocationName(base) : 'No base assigned'

          return (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={drone.id}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  borderRadius: 3,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 8,
                  },
                }}
                onClick={() => handleDroneClick(drone)}
              >
                <CardContent>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {drone.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {drone.model || 'N/A'}
                        </Typography>
                      </Box>
                      <Chip
                        label={drone.status}
                        size="small"
                        color={getStatusColor(drone.status) as any}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getBatteryIcon(battery)}
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Battery: {battery}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={battery}
                          sx={{ height: 6, borderRadius: 1, mt: 0.5 }}
                          color={battery >= 60 ? 'success' : battery >= 20 ? 'warning' : 'error'}
                        />
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {location}
                      </Typography>
                    </Box>

                    {drone.last_check_in && (
                      <Typography variant="caption" color="text.secondary">
                        Last check-in: {formatTimeAgo(drone.last_check_in)}
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {/* Bases Section */}
      <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
        Bases ({filteredBases.length})
      </Typography>
      <Grid container spacing={2}>
        {filteredBases.map((base) => {
          const droneCount = getBaseDroneCount(base.id)
          const location = getLocationName(base)

          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={base.id}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  borderRadius: 3,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 8,
                  },
                }}
                onClick={() => handleBaseClick(base)}
              >
                <CardContent>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Home sx={{ fontSize: 24, color: 'primary.main' }} />
                      <Typography variant="h6" fontWeight="bold">
                        {base.name}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {location}
                      </Typography>
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                      Coordinates: {base.lat.toFixed(4)}, {base.lng.toFixed(4)}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <FlightTakeoff sx={{ fontSize: 16, color: 'primary.main' }} />
                      <Typography variant="body2" fontWeight="medium">
                        {droneCount} drone{droneCount !== 1 ? 's' : ''} assigned
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {filteredDrones.length === 0 && filteredBases.length === 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 8,
          }}
        >
          <Typography variant="h6" color="text.secondary">
            No drones or bases found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Try adjusting your search or filters
          </Typography>
        </Box>
      )}
    </Box>
  )
}

// Memoize component to prevent unnecessary re-renders
export default memo(FleetOverviewComponent)

