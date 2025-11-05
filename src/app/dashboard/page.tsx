'use client'

import { useEffect, useState } from 'react'
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
      <div className="h-screen flex bg-primary transition-colors">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative">
            <DroneMap isDrawing={isDrawing} onDrawingChange={setIsDrawing} />
            <div className="absolute top-4 right-4 w-80 z-10">
              <VideoFeed />
            </div>
          </div>
          <ActionBar onDrawingChange={setIsDrawing} />
        </div>
      </div>
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

