'use client'

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ScheduleModal({ isOpen, onClose }: ScheduleModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="glass p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4">Schedule Flight</h2>
        {/* Schedule form will be implemented */}
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-gray-500/30 hover:bg-gray-500/40 rounded text-white"
        >
          Close
        </button>
      </div>
    </div>
  )
}

