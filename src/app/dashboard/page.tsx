'use client'

import { useEffect, useState, useRef, Suspense, useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Box, CircularProgress } from '@mui/material'
import AuthGuard from '@/components/AuthGuard'
import NavigationToolbar from '@/components/NavigationToolbar'
import Sidebar from '@/components/Sidebar'
import dynamic from 'next/dynamic'
import ActionBar from '@/components/ActionBar'

// Dynamically import heavy components to improve initial load
const DroneMap = dynamic(() => import('@/components/DroneMap'), {
  ssr: false,
  loading: () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <CircularProgress />
    </Box>
  ),
})

const VideoFeed = dynamic(() => import('@/components/VideoFeed'), {
  ssr: false,
})
import ErrorDisplay from '@/components/ErrorDisplay'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { ApiError } from '@/lib/api'
import { SimulationEngine } from '@/lib/simulation'
import { mockDrones, mockBases, mockSchedules } from '@/lib/mockData'

function DashboardContentInner() {
  const searchParams = useSearchParams()
  const {
    setDrones,
    setBases,
    setSchedules,
    mergeSchedules,
    setIsLoading,
    setError,
    selectedDrone,
    selectedBase,
    setSelectedDrone,
    setSelectedBase,
    currentPath,
    simulation,
    setSimulation,
  } = useAppStore()
  const [isDrawing, setIsDrawing] = useState(false)
  const simulationEngineRef = useRef<SimulationEngine | null>(null)

  useEffect(() => {
    // Set mock data immediately for instant UI
    setDrones(mockDrones)
    setBases(mockBases)
    setSchedules(mockSchedules) // Initialize with mock schedules
    
    // Then try to fetch from API in background (non-blocking)
    // Use requestIdleCallback or setTimeout to defer API calls
    const loadInitialData = async () => {
      try {
        setIsLoading(true)
        // Short timeout for API calls - load all data in parallel
        const [dronesData, basesData, schedulesData] = await Promise.all([
          api.getDrones().catch(() => null),
          api.getBases().catch(() => null),
          api.getSchedules().catch(() => null),
        ])
        // Only update if we got valid data
        if (dronesData && dronesData.length > 0) {
          setDrones(dronesData)
        }
        if (basesData && basesData.length > 0) {
          setBases(basesData)
        }
        if (schedulesData && schedulesData.length > 0) {
          mergeSchedules(schedulesData)
        }
      } catch (error) {
        // Silently fail - we already have mock data
        console.warn('API fetch failed, using mock data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    // Defer API calls to not block initial render
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(loadInitialData, { timeout: 1000 })
    } else {
      setTimeout(loadInitialData, 100)
    }
  }, [setDrones, setBases, setIsLoading, setSchedules, mergeSchedules])

  // Memoize drone and base selection logic
  const selectedDroneMemo = useMemo(() => {
    const droneId = searchParams?.get('drone')
    if (!droneId) return null
    
    const { drones } = useAppStore.getState()
    return drones.find((d) => d.id === droneId) || mockDrones.find((d) => d.id === droneId) || null
  }, [searchParams])

  const selectedBaseMemo = useMemo(() => {
    const baseId = searchParams?.get('base')
    if (!baseId) return null
    
    const { bases } = useAppStore.getState()
    return bases.find((b) => b.id === baseId) || mockBases.find((b) => b.id === baseId) || null
  }, [searchParams])

  // Handle query params for drone/base selection
  useEffect(() => {
    if (selectedDroneMemo) {
      setSelectedDrone(selectedDroneMemo)
    }
    if (selectedBaseMemo) {
      setSelectedBase(selectedBaseMemo)
    }
  }, [selectedDroneMemo, selectedBaseMemo, setSelectedDrone, setSelectedBase])

  // Initialize simulation engine
  useEffect(() => {
    if (!simulationEngineRef.current) {
      simulationEngineRef.current = new SimulationEngine()
    }
  }, [])

  // Memoize simulation callback to prevent recreation
  const handleSimulationUpdate = useCallback((update: any) => {
    setSimulation({
      isRunning: true,
      speed: update.speed,
      eta: update.timeRemaining,
      telemetry: update.telemetry,
      currentPosition: update.currentPosition,
    })
  }, [setSimulation])

  const handleSimulationComplete = useCallback(() => {
    setSimulation({
      isRunning: false,
      speed: undefined,
      eta: 0,
      telemetry: simulation?.telemetry,
    })
  }, [setSimulation, simulation?.telemetry])

  // Handle simulation updates
  useEffect(() => {
    if (simulation?.isRunning && currentPath && currentPath.length >= 2 && simulation.eta) {
      const engine = simulationEngineRef.current
      if (!engine) return

      engine.start(
        currentPath,
        simulation.eta,
        simulation.telemetry || {
          battery_level: 100,
          altitude_m: 100,
          heading_deg: 0,
          signal_strength: 100,
        },
        handleSimulationUpdate,
        handleSimulationComplete
      )

      return () => {
        engine.stop()
      }
    } else if (!simulation?.isRunning && simulationEngineRef.current) {
      simulationEngineRef.current.stop()
    }
  }, [simulation?.isRunning, currentPath, simulation?.eta, handleSimulationUpdate, handleSimulationComplete])

  return (
    <>
      <NavigationToolbar showBack />
      <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', bgcolor: 'background.default' }}>
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

function DashboardContent() {
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    }>
      <DashboardContentInner />
    </Suspense>
  )
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}
