'use client'

import { useEffect, useRef, useState } from 'react'
import { Box, Paper, Typography, Button, CircularProgress } from '@mui/material'
import { useAppStore } from '@/lib/store'
import type { MapInstance } from '@/lib/map'

interface DroneMapProps {
  isDrawing?: boolean
  onDrawingChange?: (drawing: boolean) => void
}

export default function DroneMap({ isDrawing = false, onDrawingChange }: DroneMapProps) {
  const ref = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<MapInstance | null>(null)
  const mapUtilsRef = useRef<any>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const { bases, selectedDrone, currentPath, setCurrentPath } = useAppStore()

  useEffect(() => {
    if (!ref.current || mapInstanceRef.current || typeof window === 'undefined') return

    let mounted = true

    // Dynamically import map utilities on client side only
    import('@/lib/map').then((mapUtils) => {
      if (!ref.current || !mounted) return
      
      mapUtilsRef.current = mapUtils
      
      // Initialize map
      const instance = mapUtils.initializeMap(ref.current)
      mapInstanceRef.current = instance
      
      // Wait for map to be ready
      instance.map.whenReady(() => {
        if (mounted) {
          setIsMapReady(true)
        }
      })
    })

    return () => {
      mounted = false
      if (mapInstanceRef.current?.map) {
        mapInstanceRef.current.map.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Add base markers
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || !bases.length || !mapUtilsRef.current) return

    try {
      mapUtilsRef.current.clearMarkers(mapInstanceRef.current)
      
      // Add new base markers
      bases.forEach((base) => {
        mapUtilsRef.current.addBaseMarker(mapInstanceRef.current, base)
      })
    } catch (error) {
      console.error('Error adding base markers:', error)
    }
  }, [bases, isMapReady])

  // Add/update drone marker
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || !selectedDrone || !mapUtilsRef.current) return

    try {
      // Find or create drone marker
      const defaultPosition: [number, number] = [-122.4194, 37.7749]
      const base = bases.find((b) => b.id === selectedDrone.base_id)
      const position: [number, number] = base ? [base.lng, base.lat] : defaultPosition

      // Remove existing drone markers (keep bases)
      const droneMarkers = mapInstanceRef.current.markers.filter(
        (m: any) => m.options.icon?.options.className === 'custom-drone-marker'
      )
      droneMarkers.forEach((m: any) => mapInstanceRef.current!.map.removeLayer(m))
      mapInstanceRef.current.markers = mapInstanceRef.current.markers.filter(
        (m: any) => m.options.icon?.options.className !== 'custom-drone-marker'
      )

      mapUtilsRef.current.addDroneMarker(mapInstanceRef.current, selectedDrone, position)
    } catch (error) {
      console.error('Error adding drone marker:', error)
    }
  }, [selectedDrone, bases, isMapReady])

  // Add path
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || !currentPath || !mapUtilsRef.current) return

    try {
      mapUtilsRef.current.addPathToMap(mapInstanceRef.current, currentPath)
    } catch (error) {
      console.error('Error adding path:', error)
    }
  }, [currentPath, isMapReady])

  // Handle drawing mode
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || !mapUtilsRef.current) return

    const { map } = mapInstanceRef.current

    if (!isDrawing) {
      return
    }

    const path: [number, number][] = currentPath || []

    const handleClick = (e: any) => {
      const coord: [number, number] = [e.latlng.lng, e.latlng.lat]
      const newPath = [...path, coord]
      setCurrentPath(newPath)

      // Add temporary waypoint marker
      mapUtilsRef.current.addDroneMarker(mapInstanceRef.current, { name: 'waypoint' }, coord, '#f59e0b')
    }

    map.on('click', handleClick)

    return () => {
      map.off('click', handleClick)
    }
  }, [isDrawing, currentPath, setCurrentPath, isMapReady])

  return (
    <Box sx={{ position: 'relative', height: '100%', width: '100%' }}>
      <div ref={ref} style={{ height: '100%', width: '100%', borderRadius: '16px', overflow: 'hidden' }} />
      {!isMapReady && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.paper',
          }}
        >
          <CircularProgress />
        </Box>
      )}
      {isDrawing && (
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            p: 2,
            zIndex: 1000,
            borderRadius: 2,
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Drawing Mode
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Click on map to add waypoints
          </Typography>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => {
              if (onDrawingChange) {
                onDrawingChange(false)
              }
              setCurrentPath(null)
              if (mapInstanceRef.current && mapUtilsRef.current) {
                mapUtilsRef.current.clearPath(mapInstanceRef.current)
              }
            }}
            sx={{ mt: 1 }}
          >
            Cancel
          </Button>
        </Paper>
      )}
    </Box>
  )
}
