'use client'

import { useEffect, useRef, useState, memo, useMemo, useCallback } from 'react'
import { Box, Paper, Typography, Button, CircularProgress } from '@mui/material'
import { useAppStore } from '@/lib/store'
import type { MapInstance } from '@/lib/map'
import { clearWaypointMarkers } from '@/lib/map'

interface DroneMapProps {
  isDrawing?: boolean
  onDrawingChange?: (drawing: boolean) => void
}

function DroneMapComponent({ isDrawing = false, onDrawingChange }: DroneMapProps) {
  const ref = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<MapInstance | null>(null)
  const mapUtilsRef = useRef<any>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [loadingDroneId, setLoadingDroneId] = useState<string | null>(null)
  const { bases, selectedDrone, currentPath, setCurrentPath, simulation, selectedBase } = useAppStore()

  useEffect(() => {
    console.log('[DroneMap] useEffect triggered - checking initialization conditions...')
    console.log('[DroneMap] ref.current:', ref.current ? `present (${ref.current.offsetWidth}x${ref.current.offsetHeight})` : 'null')
    console.log('[DroneMap] mapInstanceRef.current:', mapInstanceRef.current ? 'exists' : 'null')
    console.log('[DroneMap] window:', typeof window !== 'undefined' ? 'available' : 'undefined')
    
    // Enhanced container check - ensure it has dimensions
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      console.log('[DroneMap] Container bounding rect:', `${rect.width}x${rect.height}`)
      if (rect.width === 0 || rect.height === 0) {
        console.warn('[DroneMap] ⚠️ Container has zero dimensions. Waiting for layout...')
        // Wait a bit for layout to settle
        const checkLayout = setTimeout(() => {
          if (ref.current) {
            const newRect = ref.current.getBoundingClientRect()
            console.log('[DroneMap] Container dimensions after delay:', `${newRect.width}x${newRect.height}`)
          }
        }, 100)
        // Continue anyway - map should handle this
      }
    }
    
    if (!ref.current || mapInstanceRef.current || typeof window === 'undefined') {
      console.log('[DroneMap] ⏭️ Skipping initialization - conditions not met')
      return
    }

    let mounted = true
    console.log('[DroneMap] ✅ Initialization conditions met, starting map setup...')

    // Lazy load map initialization after a delay to not block render
    // Use requestIdleCallback if available, otherwise setTimeout with longer delay
    const initMap = () => {
      console.log('[DroneMap] initMap called, importing map utilities...')
      
      // Dynamically import map utilities on client side only
      import('@/lib/map').then(async (mapUtils) => {
        console.log('[DroneMap] Map utilities imported, checking ref and mounted status...')
        console.log('[DroneMap] ref.current after import:', ref.current ? 'present' : 'null')
        console.log('[DroneMap] mounted:', mounted)
        
        if (!ref.current || !mounted) {
          console.warn('[DroneMap] ⚠️ Skipping initialization - ref missing or component unmounted')
          return
        }
        
        mapUtilsRef.current = mapUtils
        console.log('[DroneMap] Map utilities stored in ref')
        
        try {
          console.log('[DroneMap] Calling initializeMap...')
          const initStartTime = performance.now()
          
          // Initialize map (with fallback)
          const instance = await mapUtils.initializeMap(ref.current)
          const initDuration = performance.now() - initStartTime
          
          console.log(`[DroneMap] Map initialized in ${initDuration.toFixed(2)}ms`)
          mapInstanceRef.current = instance
          
          // Log map loaded
          console.log('[DroneMap] 🗺️ ArcGIS map loaded successfully')
          
          console.log('[DroneMap] Setting up whenReady callback...')
          // Wait for map to be ready (no timeout - let it complete naturally)
          instance.whenReady(() => {
            console.log('[DroneMap] Map whenReady callback fired')
            if (mounted) {
              console.log('[DroneMap] ✅ Setting isMapReady to true')
              setIsMapReady(true)
            } else {
              console.warn('[DroneMap] ⚠️ Component unmounted, not setting isMapReady')
            }
          })
        } catch (error) {
          console.error('[DroneMap] ❌ Map initialization failed completely:', error)
          if (error instanceof Error) {
            console.error('[DroneMap] Error details:', error.message, error.stack)
          }
          if (mounted) {
            console.log('[DroneMap] Setting isMapReady to true despite error (to show UI)')
            setIsMapReady(true) // Show map even if there was an error
          }
        }
      }).catch((importError) => {
        console.error('[DroneMap] ❌ Failed to import map utilities:', importError)
        if (mounted) {
          setIsMapReady(true) // Show UI even if import fails
        }
      })
        }

    // Initialize map immediately to ensure proper loading sequence
    console.log('[DroneMap] Initializing map immediately...')
    initMap()

      return () => {
      console.log('[DroneMap] Cleanup: cleaning up map')
        mounted = false
        if (mapInstanceRef.current) {
          try {
            if (typeof mapInstanceRef.current.remove === 'function') {
              mapInstanceRef.current.remove()
            console.log('[DroneMap] Map instance removed')
          }
        } catch (error) {
          console.error('[DroneMap] Error cleaning up map:', error)
        }
        mapInstanceRef.current = null
      }
    }
  }, [])
  // Add base markers - show selected drone's base or all bases
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || !mapUtilsRef.current) {
      if (!mapInstanceRef.current) console.log('[DroneMap] ⏭️ Skipping base markers - map instance not ready')
      if (!isMapReady) console.log('[DroneMap] ⏭️ Skipping base markers - map not ready')
      if (!mapUtilsRef.current) console.log('[DroneMap] ⏭️ Skipping base markers - map utils not ready')
      return
    }

    console.log('[DroneMap] Adding base markers...')
    const addMarkers = async () => {
      try {
        // Only clear markers that are bases (not waypoints or drones)
        const instance = mapInstanceRef.current
        if (!instance) return
        
        // ArcGIS only - clear base graphics
          const baseGraphics = instance.markers.filter(
            (m: any) => m.attributes?.type === 'base'
          )
          baseGraphics.forEach((m: any) => {
              instance.graphicsLayer.remove(m)
          })
          instance.markers = instance.markers.filter(
            (m: any) => m.attributes?.type !== 'base'
          )
        
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
        console.log('[DroneMap] ✅ Base markers added successfully')
      } catch (error) {
        console.error('[DroneMap] ❌ Error adding base markers:', error)
      }
    }

    addMarkers()
  }, [bases, isMapReady, selectedDrone, selectedBase])

  // Auto-center map when drone or base is selected
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || !mapUtilsRef.current) return

    const centerMap = async () => {
      try {
        if (selectedDrone) {
          console.log('[DroneMap] Centering on selected drone:', selectedDrone.id)
          const base = bases.find((b) => b.id === selectedDrone.base_id)
          if (base) {
            await mapInstanceRef.current!.centerOn(base.lng, base.lat, 14)
            console.log('[DroneMap] ✅ Map centered on drone base')
          }
        } else if (selectedBase) {
          console.log('[DroneMap] Centering on selected base:', selectedBase.id)
          await mapInstanceRef.current!.centerOn(selectedBase.lng, selectedBase.lat, 14)
          console.log('[DroneMap] ✅ Map centered on base')
        }
      } catch (error) {
        console.error('[DroneMap] ❌ Error centering map:', error)
      }
    }

    centerMap()
  }, [selectedDrone, selectedBase, isMapReady, bases])

  // Add/update drone marker with loading indicator
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || !selectedDrone || !mapUtilsRef.current) return

    console.log('[DroneMap] Adding/updating drone marker for:', selectedDrone.id)
    const addDrone = async () => {
      setLoadingDroneId(selectedDrone.id)
      try {
        // Small delay to show loading indicator
        await new Promise(resolve => setTimeout(resolve, 300))
        
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

        // ArcGIS only - filter out drone graphics
          const droneGraphics = instance.markers.filter(
            (m: any) => m.attributes?.type === 'drone'
          )
          droneGraphics.forEach((m: any) => {
              instance.graphicsLayer.remove(m)
          })
          instance.markers = instance.markers.filter(
            (m: any) => m.attributes?.type !== 'drone'
          )

        await mapUtilsRef.current.addDroneMarker(mapInstanceRef.current, selectedDrone, position)
        console.log('[DroneMap] ✅ Drone marker added successfully')
      } catch (error) {
        console.error('[DroneMap] ❌ Error adding drone marker:', error)
      } finally {
        setLoadingDroneId(null)
      }
    }

    addDrone()
  }, [selectedDrone, bases, isMapReady, simulation?.currentPosition, simulation?.isRunning])

  // Add/clear path
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || !mapUtilsRef.current) return

    console.log('[DroneMap] Updating path, currentPath length:', currentPath?.length || 0)
    const updatePath = async () => {
      try {
        if (currentPath && currentPath.length > 0) {
          await mapUtilsRef.current.addPathToMap(mapInstanceRef.current, currentPath)
          console.log('[DroneMap] ✅ Path added to map')
        } else {
          // Clear path if currentPath is null or empty
          await mapUtilsRef.current.clearPath(mapInstanceRef.current)
          // Also clear waypoint markers when path is cleared
          if (mapInstanceRef.current) {
            clearWaypointMarkers(mapInstanceRef.current)
          }
          console.log('[DroneMap] ✅ Path cleared from map')
        }
      } catch (error) {
        console.error('[DroneMap] ❌ Error updating path:', error)
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

      // ArcGIS event handling only
      const handleClick = async (event: any) => {
        const { longitude, latitude } = event.mapPoint
        const coord: [number, number] = [longitude, latitude]
        
        // Read current path from store inside handler to avoid stale closure
        const currentPathFromStore = useAppStore.getState().currentPath || []
        const waypointNumber = currentPathFromStore.length + 1
        const newPath = [...currentPathFromStore, coord]
        setCurrentPath(newPath)

        // Log waypoint with name and coordinates
        console.log(`=== Waypoint ${waypointNumber} Placed ===`)
        console.log(`Waypoint ${waypointNumber}:`)
        console.log('  Longitude:', longitude)
        console.log('  Latitude:', latitude)
        console.log('  Coordinates:', coord)
        console.log('Total Waypoints:', newPath.length)
        console.log('All Waypoints:', newPath)
        console.log('========================')

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
      if (mapInstanceRef.current) {
        try {
          clearWaypointMarkers(mapInstanceRef.current)
        } catch (error) {
          console.error('[DroneMap] Error clearing waypoint markers:', error)
        }
      }
    }
  }, [isDrawing, setCurrentPath, isMapReady])

  // Log container dimensions when component renders
  useEffect(() => {
    if (ref.current) {
      const checkDimensions = () => {
        const rect = ref.current?.getBoundingClientRect()
        console.log('[DroneMap] Container dimensions:', rect ? `${rect.width}x${rect.height}` : 'unknown')
      }
      checkDimensions()
      // Check again after a short delay to catch layout changes
      const timeout = setTimeout(checkDimensions, 100)
      return () => clearTimeout(timeout)
    }
  }, [isMapReady])

  return (
    <Box sx={{ position: 'relative', height: '100%', width: '100%' }}>
      <div 
        ref={ref} 
        style={{ height: '100%', width: '100%', borderRadius: '16px', overflow: 'hidden' }}
        data-testid="map-container"
      />
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
      {loadingDroneId && isMapReady && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 1000,
            bgcolor: 'background.paper',
            borderRadius: 2,
            p: 1.5,
            boxShadow: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Loading drone...
          </Typography>
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
