'use client'

import { IconButton, Tooltip } from '@mui/material'
import { LightMode, DarkMode } from '@mui/icons-material'
import { useMUITheme } from '@/lib/mui-theme'

export default function ThemeToggle() {
  const { mode, setMode } = useMUITheme()

  const toggleTheme = () => {
    setMode(mode === 'light' ? 'dark' : 'light')
  }

  return (
    <Tooltip title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
      <IconButton
        onClick={toggleTheme}
        color="inherit"
        sx={{
          borderRadius: 2,
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        {mode === 'dark' ? <LightMode /> : <DarkMode />}
      </IconButton>
    </Tooltip>
  )
}
