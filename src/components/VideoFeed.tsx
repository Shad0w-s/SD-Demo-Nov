'use client'

import { Paper, Box, Typography, Chip, Stack } from '@mui/material'
import { VideocamOff, Battery5Bar, Height, SignalCellularAlt } from '@mui/icons-material'
import { useAppStore } from '@/lib/store'

export default function VideoFeed() {
  const { selectedDrone, simulation } = useAppStore()

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        height: 280,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 2,
      }}
    >
      <VideocamOff sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Feed Not Live
      </Typography>
      {selectedDrone && (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {selectedDrone.name}
        </Typography>
      )}
      {simulation?.telemetry && (
        <Stack spacing={1} sx={{ mt: 2, width: '100%' }}>
          <Chip
            icon={<Battery5Bar />}
            label={`Battery: ${simulation.telemetry.battery_level}%`}
            size="small"
            color="success"
          />
          <Chip
            icon={<Height />}
            label={`Altitude: ${simulation.telemetry.altitude_m.toFixed(0)}m`}
            size="small"
            color="info"
          />
          <Chip
            icon={<SignalCellularAlt />}
            label={`Signal: ${simulation.telemetry.signal_strength}%`}
            size="small"
            color="primary"
          />
        </Stack>
      )}
    </Paper>
  )
}
