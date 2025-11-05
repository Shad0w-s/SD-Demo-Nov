'use client'

import { useEffect, useState, useRef } from 'react'
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
import { SimulationEngine } from '@/lib/simulation'

function DashboardContent() {
  const {
    setDrones,
    setBases,
    setIsLoading,
    setError,
    selectedDrone,
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
