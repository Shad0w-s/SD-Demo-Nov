'use client'

import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { initializeMap, addBaseMarker, addDroneMarker, addPathToMap, clearPath, MapInstance } from '@/lib/arcgis'

interface DroneMapProps {
  isDrawing?: boolean
  onDrawingChange?: (drawing: boolean) => void
}

export default function DroneMap({ isDrawing = false, onDrawingChange }: DroneMapProps) {
  const ref = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<MapInstance | null>(null)
  const { bases, selectedDrone, currentPath, setCurrentPath } = useAppStore()

  useEffect(() => {
    if (!ref.current || mapInstanceRef.current) return

    // Initialize map
    const instance = initializeMap(ref.current)
    mapInstanceRef.current = instance

    return () => {
      if (instance.view) {
        instance.view.destroy()
      }
    }
  }, [])

  // Add base markers
  useEffect(() => {
    if (!mapInstanceRef.current || !bases.length) return

    const { graphicsLayer } = mapInstanceRef.current
    
    // Clear existing base markers
    const baseGraphics = graphicsLayer.graphics.filter(
      (g) => g.attributes?.type === 'base'
    )
    baseGraphics.forEach((g) => graphicsLayer.remove(g))

    // Add new base markers
    bases.forEach((base) => {
      addBaseMarker(graphicsLayer, base)
    })
  }, [bases])

  // Add/update drone marker
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedDrone) return

    const { graphicsLayer } = mapInstanceRef.current
    
    // Find existing drone marker
    const existingDrone = graphicsLayer.graphics.find(
      (g) => g.attributes?.type === 'drone' && g.attributes?.id === selectedDrone.id
    )

    if (existingDrone) {
      graphicsLayer.remove(existingDrone)
    }

    // Add drone marker at first base or default location
    const defaultPosition: [number, number] = [-122.4, 37.79]
    const base = bases.find((b) => b.id === selectedDrone.base_id)
    const position: [number, number] = base ? [base.lng, base.lat] : defaultPosition

    addDroneMarker(graphicsLayer, selectedDrone, position)
  }, [selectedDrone, bases])

  // Add path
  useEffect(() => {
    if (!mapInstanceRef.current || !currentPath) return

    const { graphicsLayer } = mapInstanceRef.current
    clearPath(graphicsLayer)
    addPathToMap(graphicsLayer, currentPath)
  }, [currentPath])

  // Handle drawing mode
  useEffect(() => {
    if (!mapInstanceRef.current) return

    const { view, graphicsLayer } = mapInstanceRef.current
    
    if (!isDrawing) {
      // Clear drawing event listeners
      return
    }

    const path: [number, number][] = currentPath || []

    const handleClick = (event: any) => {
      const point = view.toMap(event)
      if (point.longitude != null && point.latitude != null) {
        const coord: [number, number] = [point.longitude, point.latitude]
        const newPath = [...path, coord]
        setCurrentPath(newPath)

        // Add temporary waypoint marker
        addDroneMarker(graphicsLayer, { name: 'waypoint' }, coord, '#f59e0b')
      }
    }

    const clickHandle = view.on('click', handleClick)

    return () => {
      if (clickHandle) {
        clickHandle.remove()
      }
    }
  }, [isDrawing, currentPath, setCurrentPath])

  return (
    <div className="relative h-full w-full">
      <div ref={ref} className="h-full w-full" />
      {isDrawing && (
        <div className="absolute top-4 left-4 glass p-4 z-10">
          <p className="text-primary text-sm font-semibold mb-2">Drawing Mode</p>
          <p className="text-secondary text-xs">Click on map to add waypoints</p>
          <button
            onClick={() => {
              if (onDrawingChange) {
                onDrawingChange(false)
              }
              setCurrentPath(null)
              if (mapInstanceRef.current) {
                clearPath(mapInstanceRef.current.graphicsLayer)
              }
            }}
            className="mt-2 px-3 py-1 bg-red-500/30 hover:bg-red-500/40 rounded text-primary text-sm"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
