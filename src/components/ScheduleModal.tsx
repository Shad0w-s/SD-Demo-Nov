'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { ApiError } from '@/lib/api'

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ScheduleModal({ isOpen, onClose }: ScheduleModalProps) {
  const { selectedDrone, currentPath, setSchedules, setIsLoading, setError } = useAppStore()
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Set default start time to 1 hour from now
      const now = new Date()
      now.setHours(now.getHours() + 1)
      setStartTime(now.toISOString().slice(0, 16))
      setEndTime('')
    }
  }, [isOpen])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!selectedDrone) {
      setError('Please select a drone first')
      return
    }

    if (!startTime) {
      setError('Start time is required')
      return
    }

    try {
      setIsSubmitting(true)
      setIsLoading(true)

      const scheduleData = {
        drone_id: selectedDrone.id,
        start_time: new Date(startTime).toISOString(),
        end_time: endTime ? new Date(endTime).toISOString() : undefined,
        path_json: currentPath ? { coordinates: currentPath } : undefined,
      }

      await api.createSchedule(scheduleData)
      
      // Reload schedules
      const schedules = await api.getSchedules()
      setSchedules(schedules)
      
      onClose()
      setStartTime('')
      setEndTime('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create schedule')
    } finally {
      setIsSubmitting(false)
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="glass p-6 w-full max-w-md glass-hover">
        <h2 className="text-2xl font-bold text-primary mb-4">Schedule Flight</h2>
        
        {!selectedDrone && (
          <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-200 text-sm">
            Please select a drone first
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-secondary mb-2">
              Start Time
            </label>
            <input
              id="startTime"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              disabled={!selectedDrone || isSubmitting}
              className="w-full px-4 py-2 bg-white/10 dark:bg-black/20 border border-white/30 dark:border-white/10 rounded-lg text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-secondary mb-2">
              End Time (Optional)
            </label>
            <input
              id="endTime"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={!selectedDrone || isSubmitting}
              min={startTime}
              className="w-full px-4 py-2 bg-white/10 dark:bg-black/20 border border-white/30 dark:border-white/10 rounded-lg text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={!selectedDrone || isSubmitting}
              className="flex-1 px-4 py-2 bg-green-500/30 hover:bg-green-500/40 dark:bg-green-500/20 dark:hover:bg-green-500/30 rounded text-primary font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule Flight'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-500/30 hover:bg-gray-500/40 dark:bg-gray-500/20 dark:hover:bg-gray-500/30 rounded text-primary transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
