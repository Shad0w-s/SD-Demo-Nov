'use client'

import { useAppStore } from '@/lib/store'

export default function VideoFeed() {
  const { selectedDrone, simulation } = useAppStore()

  return (
    <div className="glass p-6 h-64 flex flex-col items-center justify-center glass-hover">
      <div className="text-center">
        <p className="text-secondary text-lg mb-2">📹</p>
        <p className="text-primary font-semibold mb-2">Feed Not Live</p>
        {selectedDrone && (
          <p className="text-secondary text-xs">
            {selectedDrone.name}
          </p>
        )}
        {simulation?.telemetry && (
          <div className="mt-4 space-y-1 text-xs text-secondary">
            <p>Battery: {simulation.telemetry.battery_level}%</p>
            <p>Altitude: {simulation.telemetry.altitude_m.toFixed(0)}m</p>
            <p>Signal: {simulation.telemetry.signal_strength}%</p>
          </div>
        )}
      </div>
    </div>
  )
}

