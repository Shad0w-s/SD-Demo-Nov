'use client'

import { useEffect, useRef, useState, memo, useMemo, useCallback } from 'react'
import { Box, Paper, Typography, Button, CircularProgress } from '@mui/material'
import { useAppStore } from '@/lib/store'
import type { MapInstance } from '@/lib/map'

interface DroneMapProps {
  isDrawing?: boolean
  onDrawingChange?: (drawing: boolean) => void
}

function DroneMapComponent({ isDrawing = false, onDrawingChange }: DroneMapProps) {
  const ref = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<MapInstance | null>(null)
  const mapUtilsRef = useRef<any>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const { bases, selectedDrone, currentPath, setCurrentPath, simulation, selectedBase } = useAppStore()

  useEffect(() => {
    if (!ref.current || mapInstanceRef.current || typeof window === 'undefined') return

    let mounted = true

    // Lazy load map initialization after a short delay to not block render
    const initTimeout = setTimeout(() => {
      // Dynamically import map utilities on client side only
      import('@/lib/map').then(async (mapUtils) => {
        if (!ref.current || !mounted) return
        
        mapUtilsRef.current = mapUtils
        
        try {
          // Initialize map (with fallback)
          const instance = await mapUtils.initializeMap(ref.current)
          mapInstanceRef.current = instance
          
          // Wait for map to be ready
          instance.whenReady(() => {
            if (mounted) {
              setIsMapReady(true)
            }
          })
        } catch (error) {
          console.error('Map initialization failed:', error)
          if (mounted) {
            setIsMapReady(true) // Show map even if there was an error
          }
        }
      })
    }, 100) // Small delay to allow page to render first

    return () => {
      clearTimeout(initTimeout)
      mounted = false
      if (mapInstanceRef.current) {
        try {
          if (typeof mapInstanceRef.current.remove === 'function') {
            mapInstanceRef.current.remove()
          }
        } catch (error) {
          console.error('Error cleaning up map:', error)
        }
        mapInstanceRef.current = null
      }
    }
  }, [])
  // Add base markers - show selected drone's base or all bases
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || !mapUtilsRef.current) return

    const addMarkers = async () => {
      try {
        // Only clear markers that are bases (not waypoints or drones)
        const instance = mapInstanceRef.current
        if (!instance) return
        
        if (instance.type === 'arcgis') {
          const baseGraphics = instance.markers.filter(
            (m: any) => m.attributes?.type === 'base'
          )
          baseGraphics.forEach((m: any) => {
            if (instance.graphicsLayer) {
              instance.graphicsLayer.remove(m)
            }
          })
          instance.markers = instance.markers.filter(
            (m: any) => m.attributes?.type !== 'base'
          )
        } else {
          const baseMarkers = instance.markers.filter(
            (m: any) => m.options?.icon?.options?.className === 'custom-marker'
          )
          baseMarkers.forEach((m: any) => {
            if (instance.leafletMap) {
              instance.leafletMap.removeLayer(m)
            }
          })
          instance.markers = instance.markers.filter(
            (m: any) => m.options?.icon?.options?.className !== 'custom-marker'
          )
        }
        
        // Show selected drone's base if available, otherwise show all bases
        if (selectedDrone?.base_id) {
          const droneBase = bases.find((b) => b.id === selectedDrone.base_id)
          if (droneBase) {
            await mapUtilsRef.current.addBaseMarker(mapInstanceRef.current, droneBase)
          }
        } else if (selectedBase) {
          await mapUtilsRef.current.addBaseMarker(mapInstanceRef.current, selectedBase)
        } else if (bases.length > 0) {
          // Show all bases if no specific selection
          for (const base of bases) {
            await mapUtilsRef.current.addBaseMarker(mapInstanceRef.current, base)
          }
        }
      } catch (error) {
        console.error('Error adding base markers:', error)
      }
    }

    addMarkers()
  }, [bases, isMapReady, selectedDrone, selectedBase])

  // Add/update drone marker
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || !selectedDrone || !mapUtilsRef.current) return

    const addDrone = async () => {
      try {
        // Use simulation position if available, otherwise use base position
        const defaultPosition: [number, number] = [-122.4194, 37.7749]
        const base = bases.find((b) => b.id === selectedDrone.base_id)
        let position: [number, number] = base ? [base.lng, base.lat] : defaultPosition
        
        // Override with simulation position if simulation is running
        if (simulation?.isRunning && simulation.currentPosition) {
          position = simulation.currentPosition
        }

        // Remove existing drone markers (keep bases)
        const instance = mapInstanceRef.current
        if (!instance) return

        if (instance.type === 'arcgis') {
          // Filter out drone graphics
          const droneGraphics = instance.markers.filter(
            (m: any) => m.attributes?.type === 'drone'
          )
          droneGraphics.forEach((m: any) => {
            if (instance.graphicsLayer) {
              instance.graphicsLayer.remove(m)
            }
          })
          instance.markers = instance.markers.filter(
            (m: any) => m.attributes?.type !== 'drone'
          )
        } else {
          // Leaflet implementation
          const droneMarkers = instance.markers.filter(
            (m: any) => m.options.icon?.options.className === 'custom-drone-marker'
          )
          droneMarkers.forEach((m: any) => {
            if (instance.leafletMap) {
              instance.leafletMap.removeLayer(m)
            }
          })
          instance.markers = instance.markers.filter(
            (m: any) => m.options.icon?.options.className !== 'custom-drone-marker'
          )
        }

        await mapUtilsRef.current.addDroneMarker(mapInstanceRef.current, selectedDrone, position)
      } catch (error) {
        console.error('Error adding drone marker:', error)
      }
    }

    addDrone()
  }, [selectedDrone, bases, isMapReady, simulation?.currentPosition, simulation?.isRunning])

  // Add/clear path
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || !mapUtilsRef.current) return

    const updatePath = async () => {
      try {
        if (currentPath && currentPath.length > 0) {
          await mapUtilsRef.current.addPathToMap(mapInstanceRef.current, currentPath)
        } else {
          // Clear path if currentPath is null or empty
          await mapUtilsRef.current.clearPath(mapInstanceRef.current)
        }
      } catch (error) {
        console.error('Error updating path:', error)
      }
    }

    updatePath()
  }, [currentPath, isMapReady])

  // Handle drawing mode
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || !mapUtilsRef.current) return

    if (!isDrawing) {
      return
    }

    let clickHandler: any = null

    const setupClickHandler = async () => {
      const instance = mapInstanceRef.current
      if (!instance) return

      if (instance.type === 'arcgis') {
        // ArcGIS event handling
        const handleClick = async (event: any) => {
          const { longitude, latitude } = event.mapPoint
          const coord: [number, number] = [longitude, latitude]
          
          // Read current path from store inside handler to avoid stale closure
          const currentPathFromStore = useAppStore.getState().currentPath || []
          const newPath = [...currentPathFromStore, coord]
          setCurrentPath(newPath)

          // Add temporary waypoint marker
          await mapUtilsRef.current.addDroneMarker(
            instance,
            { name: 'waypoint' },
            coord,
            '#f59e0b'
          )
        }

        if (instance.view) {
          instance.view.on('click', handleClick)
          clickHandler = { remove: () => instance.view?.off('click', handleClick) }
        }
      } else {
        // Leaflet event handling
        const handleClick = async (e: any) => {
          const coord: [number, number] = [e.latlng.lng, e.latlng.lat]
          
          // Read current path from store inside handler to avoid stale closure
          const currentPathFromStore = useAppStore.getState().currentPath || []
          const newPath = [...currentPathFromStore, coord]
          setCurrentPath(newPath)

          // Add temporary waypoint marker
          await mapUtilsRef.current.addDroneMarker(
            instance,
            { name: 'waypoint' },
            coord,
            '#f59e0b'
          )
        }

        if (instance.leafletMap) {
          instance.leafletMap.on('click', handleClick)
          clickHandler = { remove: () => instance.leafletMap?.off('click', handleClick) }
        }
      }
    }

    setupClickHandler()

    return () => {
      if (clickHandler) {
        try {
          clickHandler.remove()
        } catch (error) {
          console.error('Error removing click handler:', error)
        }
      }
      
      // Clear waypoint markers when stopping drawing
      if (mapInstanceRef.current && mapUtilsRef.current) {
        const instance = mapInstanceRef.current
        try {
          // Always clear waypoints when drawing stops (cleanup runs when isDrawing changes)
          if (instance.type === 'arcgis' && instance.graphicsLayer) {
            const waypointGraphics = instance.markers.filter(
              (m: any) => m.attributes?.name === 'waypoint'
            )
            waypointGraphics.forEach((m: any) => {
              instance.graphicsLayer.remove(m)
            })
            instance.markers = instance.markers.filter(
              (m: any) => m.attributes?.name !== 'waypoint'
            )
          } else if (instance.type === 'osm' && instance.leafletMap) {
            const waypointMarkers = instance.markers.filter(
              (m: any) => m._popup?.content?.includes('waypoint') ||
                         (m.options?.icon && m.options.icon.options?.html?.includes('waypoint'))
            )
            waypointMarkers.forEach((m: any) => {
              instance.leafletMap.removeLayer(m)
            })
            instance.markers = instance.markers.filter(
              (m: any) => !(m._popup?.content?.includes('waypoint') ||
                           (m.options?.icon && m.options.icon.options?.html?.includes('waypoint')))
            )
          }
        } catch (error) {
          console.error('Error clearing waypoint markers:', error)
        }
      }
    }
  }, [isDrawing, setCurrentPath, isMapReady])

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
            onClick={async () => {
              if (onDrawingChange) {
                onDrawingChange(false)
              }
              setCurrentPath(null)
              if (mapInstanceRef.current && mapUtilsRef.current) {
                await mapUtilsRef.current.clearPath(mapInstanceRef.current)
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

// Memoize component to prevent unnecessary re-renders
export default memo(DroneMapComponent)
