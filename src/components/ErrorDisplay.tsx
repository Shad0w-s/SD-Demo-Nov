'use client'

import { useEffect } from 'react'
import { Snackbar, Alert, IconButton } from '@mui/material'
import { Close } from '@mui/icons-material'
import { useAppStore } from '@/lib/store'

export default function ErrorDisplay() {
  const { error, setError } = useAppStore()

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, setError])

  return (
    <Snackbar
      open={!!error}
      autoHideDuration={5000}
      onClose={() => setError(null)}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert
        onClose={() => setError(null)}
        severity="error"
        sx={{ width: '100%', borderRadius: 2 }}
        action={
          <IconButton size="small" color="inherit" onClick={() => setError(null)}>
            <Close fontSize="small" />
          </IconButton>
        }
      >
        {error}
      </Alert>
    </Snackbar>
  )
}
