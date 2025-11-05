'use client'

import { createTheme, ThemeProvider as MUIThemeProvider, CssBaseline } from '@mui/material'
import { createContext, useContext, useEffect, useState } from 'react'

interface ThemeContextType {
  mode: 'light' | 'dark'
  setMode: (mode: 'light' | 'dark') => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useMUITheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useMUITheme must be used within MUIThemeProviderWrapper')
  }
  return context
}

export function MUIThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedMode = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (savedMode) {
      setMode(savedMode)
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('theme', mode)
    }
  }, [mode, mounted])

  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#90caf9' : '#1976d2',
        light: mode === 'dark' ? '#e3f2fd' : '#42a5f5',
        dark: mode === 'dark' ? '#42a5f5' : '#1565c0',
      },
      secondary: {
        main: mode === 'dark' ? '#ce93d8' : '#9c27b0',
        light: mode === 'dark' ? '#f3e5f5' : '#ba68c8',
        dark: mode === 'dark' ? '#ab47bc' : '#7b1fa2',
      },
      background: {
        default: mode === 'dark' ? '#0a0a0a' : '#f5f5f5',
        paper: mode === 'dark' ? 'rgba(18, 18, 18, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      },
      text: {
        primary: mode === 'dark' ? '#ffffff' : '#000000',
        secondary: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
      },
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backdropFilter: 'blur(20px)',
            borderRadius: 16,
            border: mode === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.1)' 
              : '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: mode === 'dark'
              ? '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
              : '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: 'none',
            fontWeight: 600,
            padding: '10px 24px',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backdropFilter: 'blur(20px)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
            },
          },
        },
      },
    },
  })

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      <ThemeContext.Provider value={{ mode, setMode }}>
        {children}
      </ThemeContext.Provider>
    </MUIThemeProvider>
  )
}
