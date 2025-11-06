'use client'

import { Box, Paper, Typography } from '@mui/material'
import { AdminPanelSettings } from '@mui/icons-material'
import AuthGuard from '@/components/AuthGuard'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function AdminPage() {
  return (
    <AuthGuard requiredRole="admin">
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          p: 4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <AdminPanelSettings sx={{ fontSize: 40 }} />
          <Typography variant="h4" fontWeight="bold">
            Admin Panel
          </Typography>
        </Box>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography variant="body1" color="text.secondary">
            Admin management interface coming soon...
          </Typography>
        </Paper>
      </Box>
    </AuthGuard>
  )
}
