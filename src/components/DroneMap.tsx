'use client'

import { useEffect, useRef } from 'react'

export default function DroneMap({ path }: { path?: [number, number][] }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // ArcGIS map initialization will be implemented
    if (!ref.current) return
    
    // Placeholder for ArcGIS map
    console.log('Map container ready', path)
    
    return () => {
      // Cleanup
    }
  }, [path])

  return <div ref={ref} className="h-full w-full bg-gray-800" />
}

