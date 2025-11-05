/**
 * Mock Data for Iteration 2 Testing
 * 3 Bases and 10 Drones with realistic data
 */
import { Drone, Base } from './store'

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
    model: 'FX-200',
    base_id: 'base-1',
    status: 'active',
    user_id: 'user-1',
    last_check_in: new Date(Date.now() - 3 * 60 * 1000).toISOString(), // 3 min ago
  },
  {
    id: 'drone-2',
    name: 'Eagle-2',
    model: 'FX-150',
    base_id: 'base-1',
    status: 'active',
    user_id: 'user-1',
    last_check_in: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
  },
  {
    id: 'drone-3',
    name: 'Hawk-3',
    model: 'FX-300',
    base_id: 'base-2',
    status: 'active',
    user_id: 'user-2',
    last_check_in: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 min ago
  },
  {
    id: 'drone-4',
    name: 'Raven-4',
    model: 'FX-250',
    base_id: 'base-2',
    status: 'active',
    user_id: 'user-2',
    last_check_in: new Date(Date.now() - 1 * 60 * 1000).toISOString(), // 1 min ago
  },
  // Simulated drones (4)
  {
    id: 'drone-5',
    name: 'Phoenix-5',
    model: 'FX-200',
    base_id: 'base-1',
    status: 'simulated',
    user_id: 'user-1',
    last_check_in: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 min ago
  },
  {
    id: 'drone-6',
    name: 'Griffin-6',
    model: 'FX-150',
    base_id: 'base-3',
    status: 'simulated',
    user_id: 'user-3',
    last_check_in: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min ago
  },
  {
    id: 'drone-7',
    name: 'Sparrow-7',
    model: 'FX-300',
    base_id: 'base-3',
    status: 'simulated',
    user_id: 'user-3',
    last_check_in: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // 8 min ago
  },
  {
    id: 'drone-8',
    name: 'Swift-8',
    model: 'FX-250',
    base_id: 'base-2',
    status: 'simulated',
    user_id: 'user-2',
    last_check_in: new Date(Date.now() - 12 * 60 * 1000).toISOString(), // 12 min ago
  },
  // Inactive drones (2)
  {
    id: 'drone-9',
    name: 'Dove-9',
    model: 'FX-200',
    base_id: 'base-1',
    status: 'inactive',
    user_id: 'user-1',
    last_check_in: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
  },
  {
    id: 'drone-10',
    name: 'Crow-10',
    model: 'FX-150',
    base_id: 'base-3',
    status: 'inactive',
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

