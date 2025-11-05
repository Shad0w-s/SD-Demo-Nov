'use client'

import { useEffect, useState } from 'react'
import { Box } from '@mui/material'
import AuthGuard from '@/components/AuthGuard'
import Sidebar from '@/components/Sidebar'
import DroneMap from '@/components/DroneMap'
import VideoFeed from '@/components/VideoFeed'
import ActionBar from '@/components/ActionBar'
import ErrorDisplay from '@/components/ErrorDisplay'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { ApiError } from '@/lib/api'

function DashboardContent() {
  const { setDrones, setBases, setIsLoading, setError } = useAppStore()
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoading(true)
        const [dronesData, basesData] = await Promise.all([
          api.getDrones().catch((err: ApiError) => {
            setError(err.message)
            return []
          }),
          api.getBases().catch(() => []),
        ])
        setDrones(dronesData || [])
        setBases(basesData || [])
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [setDrones, setBases, setIsLoading, setError])

  return (
    <>
      <Box sx={{ height: '100vh', display: 'flex', bgcolor: 'background.default' }}>
        <Sidebar />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flex: 1, position: 'relative' }}>
            <DroneMap isDrawing={isDrawing} onDrawingChange={setIsDrawing} />
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 320,
                zIndex: 1000,
              }}
            >
              <VideoFeed />
            </Box>
          </Box>
          <ActionBar onDrawingChange={setIsDrawing} />
        </Box>
      </Box>
      <ErrorDisplay />
    </>
  )
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}
