'use client'

import Sidebar from '@/components/Sidebar'
import DroneMap from '@/components/DroneMap'
import VideoFeed from '@/components/VideoFeed'
import ActionBar from '@/components/ActionBar'

export default function DashboardPage() {
  return (
    <div className="h-screen flex bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 relative">
          <DroneMap />
          <div className="absolute top-4 right-4 w-80">
            <VideoFeed />
          </div>
        </div>
        <ActionBar />
      </div>
    </div>
  )
}

