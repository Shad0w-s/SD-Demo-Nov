'use client'

import { useEffect, useState, memo, useMemo } from 'react'
import {
  Paper,
  Box,
  Typography,
  Chip,
  Stack,
  LinearProgress,
  Card,
  CardContent,
  IconButton,
  Collapse,
} from '@mui/material'
import {
  VideocamOff,
  Battery5Bar,
  Height,
  SignalCellularAlt,
  Speed,
  Navigation,
  Timer,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material'
import { useAppStore } from '@/lib/store'

function VideoFeedComponent() {
  const { selectedDrone, simulation } = useAppStore()
  const [progress, setProgress] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)

  // Update progress and time remaining during simulation
  useEffect(() => {
    if (!simulation?.isRunning || !simulation.eta) {
      setProgress(0)
      setTimeRemaining(null)
      return
    }

    const startTime = Date.now()
    const totalTime = simulation.eta * 1000 // Convert to milliseconds

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const currentProgress = Math.min((elapsed / totalTime) * 100, 100)
      const remaining = Math.max(0, Math.ceil((totalTime - elapsed) / 1000))

      setProgress(currentProgress)
      setTimeRemaining(remaining)

      if (currentProgress >= 100) {
        clearInterval(interval)
        setProgress(100)
        setTimeRemaining(0)
      }
    }, 100) // Update every 100ms for smooth animation

    return () => clearInterval(interval)
  }, [simulation?.isRunning, simulation?.eta])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isExpanded) {
    return (
      <Paper
        elevation={3}
        sx={{
          p: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 2,
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(true)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VideocamOff sx={{ fontSize: 20 }} />
          <Typography variant="body2" fontWeight="bold">
            {selectedDrone ? selectedDrone.name : 'Camera Feed'}
          </Typography>
        </Box>
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setIsExpanded(true) }}>
          <ExpandMore />
        </IconButton>
      </Paper>
    )
  }

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        height: '100%',
      }}
    >
      {/* Header with collapse button */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight="bold">
          {selectedDrone ? selectedDrone.name : 'No Drone Selected'}
        </Typography>
        <IconButton size="small" onClick={() => setIsExpanded(false)}>
          <ExpandLess />
        </IconButton>
      </Box>

      {selectedDrone && (
        <Chip
          label={selectedDrone.status}
          size="small"
          color={selectedDrone.status === 'active' ? 'success' : 'default'}
          sx={{ mb: 2 }}
        />
      )}

      {/* Video Placeholder */}
      <Box
        sx={{
          height: 180,
          bgcolor: 'background.default',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <VideocamOff sx={{ fontSize: 48, color: 'text.secondary' }} />
      </Box>

      {/* Simulation Progress */}
      {simulation?.isRunning && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Flight Progress
            </Typography>
            <Typography variant="caption" fontWeight="bold">
              {progress.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 8, borderRadius: 1 }}
          />
          {timeRemaining !== null && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              ETA: {formatTime(timeRemaining)}
            </Typography>
          )}
        </Box>
      )}

      {/* Telemetry Data */}
      {simulation?.telemetry ? (
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Card variant="outlined" sx={{ flex: '1 1 calc(50% - 4px)', minWidth: 120 }}>
              <CardContent sx={{ p: '8px !important', '&:last-child': { pb: '8px' } }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Battery5Bar sx={{ fontSize: 20, color: 'success.main' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Battery
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {simulation.telemetry.battery_level}%
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ flex: '1 1 calc(50% - 4px)', minWidth: 120 }}>
              <CardContent sx={{ p: '8px !important', '&:last-child': { pb: '8px' } }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Height sx={{ fontSize: 20, color: 'info.main' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Altitude
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {simulation.telemetry.altitude_m.toFixed(0)}m
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Card variant="outlined" sx={{ flex: '1 1 calc(50% - 4px)', minWidth: 120 }}>
              <CardContent sx={{ p: '8px !important', '&:last-child': { pb: '8px' } }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Speed sx={{ fontSize: 20, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Speed
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {simulation.speed?.toFixed(1) || '0.0'} m/s
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ flex: '1 1 calc(50% - 4px)', minWidth: 120 }}>
              <CardContent sx={{ p: '8px !important', '&:last-child': { pb: '8px' } }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Navigation
                    sx={{
                      fontSize: 20,
                      color: 'warning.main',
                      transform: `rotate(${simulation.telemetry.heading_deg}deg)`,
                    }}
                  />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Heading
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {simulation.telemetry.heading_deg.toFixed(0)}°
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Card variant="outlined" sx={{ flex: '1 1 calc(50% - 4px)', minWidth: 120 }}>
              <CardContent sx={{ p: '8px !important', '&:last-child': { pb: '8px' } }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <SignalCellularAlt sx={{ fontSize: 20, color: 'success.main' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Signal
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {simulation.telemetry.signal_strength}%
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {simulation.eta && (
              <Card variant="outlined" sx={{ flex: '1 1 calc(50% - 4px)', minWidth: 120 }}>
                <CardContent sx={{ p: '8px !important', '&:last-child': { pb: '8px' } }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Timer sx={{ fontSize: 20, color: 'secondary.main' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        ETA
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatTime(simulation.eta)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Box>
        </Stack>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary" align="center">
            No telemetry data available
          </Typography>
          <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 1 }}>
            Start a simulation to view telemetry
          </Typography>
        </Box>
      )}
    </Paper>
  )
}

// Memoize component to prevent unnecessary re-renders
export default memo(VideoFeedComponent)
