'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Box, CircularProgress } from '@mui/material'
import AuthGuard from '@/components/AuthGuard'
import NavigationToolbar from '@/components/NavigationToolbar'
import Sidebar from '@/components/Sidebar'
import DroneMap from '@/components/DroneMap'
import VideoFeed from '@/components/VideoFeed'
import ActionBar from '@/components/ActionBar'
import ErrorDisplay from '@/components/ErrorDisplay'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { ApiError } from '@/lib/api'
import { SimulationEngine } from '@/lib/simulation'
import { mockDrones, mockBases } from '@/lib/mockData'

function DashboardContentInner() {
  const searchParams = useSearchParams()
  const {
    setDrones,
    setBases,
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
    async function loadInitialData() {
      try {
        setIsLoading(true)
        // Try to load from API, fallback to mock data
        const [dronesData, basesData] = await Promise.all([
          api.getDrones().catch(() => mockDrones),
          api.getBases().catch(() => mockBases),
        ])
        setDrones(dronesData || mockDrones)
        setBases(basesData || mockBases)
      } catch (error) {
        // Fallback to mock data on error
        setDrones(mockDrones)
        setBases(mockBases)
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [setDrones, setBases, setIsLoading])

  // Handle query params for drone/base selection
  useEffect(() => {
    const droneId = searchParams?.get('drone')
    const baseId = searchParams?.get('base')
    
    if (droneId) {
      const { drones } = useAppStore.getState()
      const drone = drones.find((d) => d.id === droneId) || mockDrones.find((d) => d.id === droneId)
      if (drone) {
        setSelectedDrone(drone)
      }
    }
    
    if (baseId) {
      const { bases } = useAppStore.getState()
      const base = bases.find((b) => b.id === baseId) || mockBases.find((b) => b.id === baseId)
      if (base) {
        setSelectedBase(base)
      }
    }
  }, [searchParams, setSelectedDrone, setSelectedBase])

  // Initialize simulation engine
  useEffect(() => {
    if (!simulationEngineRef.current) {
      simulationEngineRef.current = new SimulationEngine()
    }
  }, [])

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
        (update) => {
          // Update simulation state with real-time data
          setSimulation({
            isRunning: true,
            speed: update.speed,
            eta: update.timeRemaining,
            telemetry: update.telemetry,
            currentPosition: update.currentPosition,
          })
        },
        () => {
          // Simulation complete
          setSimulation({
            isRunning: false,
            speed: undefined,
            eta: 0,
            telemetry: simulation.telemetry,
          })
        }
      )

      return () => {
        engine.stop()
      }
    } else if (!simulation?.isRunning && simulationEngineRef.current) {
      simulationEngineRef.current.stop()
    }
  }, [simulation?.isRunning, currentPath, simulation?.eta, setSimulation])

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
