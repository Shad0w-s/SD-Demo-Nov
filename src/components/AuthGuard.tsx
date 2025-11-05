'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Box, CircularProgress, Typography } from '@mui/material'
import { getSession, getUserRole } from '@/lib/supabaseClient'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'user'
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function checkAuth() {
      try {
        const session = await getSession()

        if (!isMounted) return

        if (!session) {
          if (pathname !== '/auth/login' && pathname !== '/auth/register') {
            router.replace('/auth/login')
          }
          setIsLoading(false)
          return
        }

        if (requiredRole === 'admin') {
          const role = await getUserRole()
          if (!isMounted) return

          if (role !== 'admin') {
            router.replace('/dashboard')
            setIsLoading(false)
            return
          }
        }

        if (isMounted) {
          setIsAuthorized(true)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        if (isMounted) {
          if (pathname !== '/auth/login' && pathname !== '/auth/register') {
            router.replace('/auth/login')
          }
          setIsLoading(false)
        }
      }
    }

    checkAuth()

    return () => {
      isMounted = false
    }
  }, [router, pathname, requiredRole])

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography color="text.secondary">Loading...</Typography>
      </Box>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
