'use client'

import { useRouter } from 'next/navigation'
import { AppBar, Toolbar, IconButton, Box, TextField, InputAdornment } from '@mui/material'
import { ArrowBack, ArrowForward, Search } from '@mui/icons-material'
import { useEffect, useState } from 'react'
import LogoutButton from './LogoutButton'

interface NavigationToolbarProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  showBack?: boolean
  showForward?: boolean
}

export default function NavigationToolbar({
  searchValue = '',
  onSearchChange,
  showBack = false,
  showForward = false,
}: NavigationToolbarProps) {
  const router = useRouter()
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)

  useEffect(() => {
    // Check browser history availability
    if (typeof window !== 'undefined') {
      setCanGoBack(window.history.length > 1)
      // Note: forward state is harder to detect without tracking navigation
      // For now, we'll use the props passed from parent
    }
  }, [])

  const handleBack = () => {
    router.back()
  }

  const handleForward = () => {
    router.forward()
  }

  return (
    <AppBar position="sticky" elevation={2} sx={{ zIndex: 1100 }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
          {(showBack || canGoBack) && (
            <IconButton
              color="inherit"
              onClick={handleBack}
              disabled={!canGoBack && !showBack}
              aria-label="Go back"
            >
              <ArrowBack />
            </IconButton>
          )}
          {(showForward || canGoForward) && (
            <IconButton
              color="inherit"
              onClick={handleForward}
              disabled={!canGoForward && !showForward}
              aria-label="Go forward"
            >
              <ArrowForward />
            </IconButton>
          )}
          {onSearchChange && (
            <TextField
              size="small"
              placeholder="Search drones and bases..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{
                flexGrow: 1,
                maxWidth: 400,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'background.paper',
                },
              }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LogoutButton />
        </Box>
      </Toolbar>
    </AppBar>
  )
}

