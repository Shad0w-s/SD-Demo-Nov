/**
 * Mock Data for Iteration 2 Testing
 * 3 Bases and 10 Drones with realistic data
 */
import { Drone, Base, Schedule } from './store'

export const mockBases: Base[] = [
  {
    id: 'base-1',
    name: 'San Francisco Base',
    lat: 37.7749,
    lng: -122.4194,
    created_at: new Date().toISOString(),
  },
  {
    id: 'base-2',
    name: 'Austin Base',
    lat: 30.2672,
    lng: -97.7431,
    created_at: new Date().toISOString(),
  },
  {
    id: 'base-3',
    name: 'New York Base',
    lat: 40.7128,
    lng: -74.0060,
    created_at: new Date().toISOString(),
  },
]

export const mockDrones: Drone[] = [
  // Active drones (4)
  {
    id: 'drone-1',
    name: 'Falcon-1',
    model: 'Perch drones V1',
    base_id: 'base-1',
    status: 'active',
    user_id: 'user-1',
    last_check_in: new Date(Date.now() - 3 * 60 * 1000).toISOString(), // 3 min ago
  },
  {
    id: 'drone-2',
    name: 'Eagle-2',
    model: 'Perch drones V1',
    base_id: 'base-1',
    status: 'active',
    user_id: 'user-1',
    last_check_in: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
  },
  {
    id: 'drone-3',
    name: 'Hawk-3',
    model: 'Perch drones V1',
    base_id: 'base-2',
    status: 'active',
    user_id: 'user-2',
    last_check_in: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 min ago
  },
  {
    id: 'drone-4',
    name: 'Raven-4',
    model: 'Perch drones V1',
    base_id: 'base-2',
    status: 'active',
    user_id: 'user-2',
    last_check_in: new Date(Date.now() - 1 * 60 * 1000).toISOString(), // 1 min ago
  },
  // Patrolling drones (2)
  {
    id: 'drone-5',
    name: 'Phoenix-5',
    model: 'Perch drones V1',
    base_id: 'base-1',
    status: 'patrolling',
    user_id: 'user-1',
    last_check_in: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 min ago
  },
  {
    id: 'drone-6',
    name: 'Griffin-6',
    model: 'Perch drones V1',
    base_id: 'base-3',
    status: 'patrolling',
    user_id: 'user-3',
    last_check_in: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min ago
  },
  // Charging drones (2)
  {
    id: 'drone-7',
    name: 'Sparrow-7',
    model: 'Perch drones V1',
    base_id: 'base-3',
    status: 'charging',
    user_id: 'user-3',
    last_check_in: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // 8 min ago
  },
  {
    id: 'drone-8',
    name: 'Swift-8',
    model: 'Perch drones V1',
    base_id: 'base-2',
    status: 'charging',
    user_id: 'user-2',
    last_check_in: new Date(Date.now() - 12 * 60 * 1000).toISOString(), // 12 min ago
  },
  // Not charging drones (2)
  {
    id: 'drone-9',
    name: 'Dove-9',
    model: 'Perch drones V1',
    base_id: 'base-1',
    status: 'not charging',
    user_id: 'user-1',
    last_check_in: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
  },
  {
    id: 'drone-10',
    name: 'Crow-10',
    model: 'Perch drones V1',
    base_id: 'base-3',
    status: 'not charging',
    user_id: 'user-3',
    last_check_in: new Date(Date.now() - 90 * 60 * 1000).toISOString(), // 1.5 hours ago
  },
]

/**
 * Helper function to get battery level for a drone (simulated)
 */
export function getDroneBattery(droneId: string): number {
  // Simulate battery levels based on drone ID
  const batteryMap: Record<string, number> = {
    'drone-1': 92,
    'drone-2': 85,
    'drone-3': 78,
    'drone-4': 95,
    'drone-5': 65,
    'drone-6': 70,
    'drone-7': 88,
    'drone-8': 72,
    'drone-9': 45,
    'drone-10': 30,
  }
  return batteryMap[droneId] || 100
}

/**
 * Helper function to get location name from coordinates
 */
export function getLocationName(base: Base): string {
  const locationMap: Record<string, string> = {
    'base-1': 'San Francisco, CA',
    'base-2': 'Austin, TX',
    'base-3': 'New York, NY',
  }
  return locationMap[base.id] || `${base.lat.toFixed(4)}, ${base.lng.toFixed(4)}`
}

/**
 * Helper function to format time ago
 */
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  return `${Math.floor(diffHours / 24)} day${Math.floor(diffHours / 24) > 1 ? 's' : ''} ago`
}

/**
 * Mock schedules - pre-loaded for some drones in their geographical areas
 */
export const mockSchedules: Schedule[] = [
  // San Francisco area schedules
  {
    id: 'schedule-1',
    drone_id: 'drone-1',
    start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    end_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
    path_json: {
      coordinates: [
        [-122.4194, 37.7749], // SF Base
        [-122.4094, 37.7849], // North
        [-122.3994, 37.7749], // East
        [-122.4094, 37.7649], // South
        [-122.4194, 37.7749], // Back to base
      ],
    },
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'schedule-2',
    drone_id: 'drone-5',
    start_time: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), // 5 hours from now
    end_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    path_json: {
      coordinates: [
        [-122.4194, 37.7749], // SF Base
        [-122.4294, 37.7649], // Southwest
        [-122.4394, 37.7549], // Further southwest
        [-122.4194, 37.7749], // Back to base
      ],
    },
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  // Austin area schedules
  {
    id: 'schedule-3',
    drone_id: 'drone-3',
    start_time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour from now
    end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    path_json: {
      coordinates: [
        [-97.7431, 30.2672], // Austin Base
        [-97.7331, 30.2772], // North
        [-97.7531, 30.2772], // Northeast
        [-97.7431, 30.2672], // Back to base
      ],
    },
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'schedule-4',
    drone_id: 'drone-4',
    start_time: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours from now
    end_time: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString(),
    path_json: {
      coordinates: [
        [-97.7431, 30.2672], // Austin Base
        [-97.7531, 30.2572], // Southeast
        [-97.7331, 30.2572], // Southwest
        [-97.7431, 30.2672], // Back to base
      ],
    },
    created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
  },
  // New York area schedules
  {
    id: 'schedule-5',
    drone_id: 'drone-6',
    start_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
    end_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    path_json: {
      coordinates: [
        [-74.0060, 40.7128], // NY Base
        [-74.0160, 40.7228], // North
        [-74.0260, 40.7128], // East
        [-74.0060, 40.7128], // Back to base
      ],
    },
    created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'schedule-6',
    drone_id: 'drone-7',
    start_time: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours from now
    end_time: new Date(Date.now() + 13 * 60 * 60 * 1000).toISOString(),
    path_json: {
      coordinates: [
        [-74.0060, 40.7128], // NY Base
        [-74.0060, 40.7028], // South
        [-73.9960, 40.7028], // Southeast
        [-74.0060, 40.7128], // Back to base
      ],
    },
    created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
  },
]

