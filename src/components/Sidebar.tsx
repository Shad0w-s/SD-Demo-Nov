'use client'

export default function Sidebar() {
  return (
    <div className="w-80 glass p-4 flex flex-col h-full">
      <h2 className="text-xl font-bold text-white mb-4">Drone Control</h2>
      {/* Drone selector dropdown */}
      <div className="mb-4">
        <select className="w-full p-2 bg-white/10 border border-white/30 rounded text-white">
          <option>Select Drone</option>
        </select>
      </div>
      {/* Schedule list */}
      <div className="flex-1 mb-4">
        <h3 className="text-sm font-semibold text-white/80 mb-2">Schedule</h3>
        <div className="space-y-2">
          {/* Schedule items will be rendered here */}
        </div>
      </div>
      {/* Quick action buttons */}
      <div className="space-y-2">
        <button className="w-full p-2 bg-red-500/20 hover:bg-red-500/30 rounded text-white">
          Return to Base
        </button>
        <button className="w-full p-2 bg-yellow-500/20 hover:bg-yellow-500/30 rounded text-white">
          Intercept
        </button>
        <button className="w-full p-2 bg-orange-500/20 hover:bg-orange-500/30 rounded text-white">
          End Early
        </button>
      </div>
    </div>
  )
}

