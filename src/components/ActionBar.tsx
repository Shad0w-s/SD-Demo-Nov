'use client'

export default function ActionBar() {
  return (
    <div className="glass p-4 flex gap-2 justify-center">
      <button className="px-4 py-2 bg-blue-500/30 hover:bg-blue-500/40 rounded text-white">
        Draw New Path
      </button>
      <button className="px-4 py-2 bg-green-500/30 hover:bg-green-500/40 rounded text-white">
        Schedule Flight
      </button>
      <button className="px-4 py-2 bg-red-500/30 hover:bg-red-500/40 rounded text-white">
        Return to Base
      </button>
      <button className="px-4 py-2 bg-yellow-500/30 hover:bg-yellow-500/40 rounded text-white">
        Intercept
      </button>
      <button className="px-4 py-2 bg-orange-500/30 hover:bg-orange-500/40 rounded text-white">
        End Early
      </button>
    </div>
  )
}

