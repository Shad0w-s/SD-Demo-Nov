/**
 * Mock Data for Iteration 2 Testing
 * 3 Bases and 10 Drones with realistic data
 */
import { Drone, Base, Schedule } from './store'

export const mockBases: Base[] = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', // base-1 (SF)
    name: 'San Francisco Base',
    lat: 37.7749,
    lng: -122.4194,
    created_at: new Date().toISOString(),
  },
  {
    id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', // base-2 (Austin)
    name: 'Austin Base',
    lat: 30.2672,
    lng: -97.7431,
    created_at: new Date().toISOString(),
  },
  {
    id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8', // base-3 (NY)
    name: 'New York Base',
    lat: 40.7128,
    lng: -74.0060,
    created_at: new Date().toISOString(),
  },
]

export const mockDrones: Drone[] = [
  // Active drones (4)
  {
    id: 'a1b2c3d4-1111-1111-1111-000000000001', // drone-1 (Falcon-1)
    name: 'Falcon-1',
    model: 'Perch drones V1',
    base_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', // SF base
    status: 'active',
    user_id: 'user-1',
    last_check_in: new Date(Date.now() - 3 * 60 * 1000).toISOString(), // 3 min ago
  },
  {
    id: 'a1b2c3d4-2222-2222-2222-000000000002', // drone-2 (Eagle-2)
    name: 'Eagle-2',
    model: 'Perch drones V1',
    base_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', // SF base
    status: 'active',
    user_id: 'user-1',
    last_check_in: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
  },
  {
    id: 'a1b2c3d4-3333-3333-3333-000000000003', // drone-3 (Hawk-3)
    name: 'Hawk-3',
    model: 'Perch drones V1',
    base_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', // Austin base
    status: 'active',
    user_id: 'user-2',
    last_check_in: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 min ago
  },
  {
    id: 'a1b2c3d4-4444-4444-4444-000000000004', // drone-4 (Raven-4)
    name: 'Raven-4',
    model: 'Perch drones V1',
    base_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', // Austin base
    status: 'active',
    user_id: 'user-2',
    last_check_in: new Date(Date.now() - 1 * 60 * 1000).toISOString(), // 1 min ago
  },
  // Patrolling drones (2)
  {
    id: 'a1b2c3d4-5555-5555-5555-000000000005', // drone-5 (Phoenix-5)
    name: 'Phoenix-5',
    model: 'Perch drones V1',
    base_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', // SF base
    status: 'patrolling',
    user_id: 'user-1',
    last_check_in: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 min ago
  },
  {
    id: 'a1b2c3d4-6666-6666-6666-000000000006', // drone-6 (Griffin-6)
    name: 'Griffin-6',
    model: 'Perch drones V1',
    base_id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8', // NY base
    status: 'patrolling',
    user_id: 'user-3',
    last_check_in: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min ago
  },
  // Charging drones (2)
  {
    id: 'a1b2c3d4-7777-7777-7777-000000000007', // drone-7 (Sparrow-7)
    name: 'Sparrow-7',
    model: 'Perch drones V1',
    base_id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8', // NY base
    status: 'charging',
    user_id: 'user-3',
    last_check_in: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // 8 min ago
  },
  {
    id: 'a1b2c3d4-8888-8888-8888-000000000008', // drone-8 (Swift-8)
    name: 'Swift-8',
    model: 'Perch drones V1',
    base_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', // Austin base
    status: 'charging',
    user_id: 'user-2',
    last_check_in: new Date(Date.now() - 12 * 60 * 1000).toISOString(), // 12 min ago
  },
  // Not charging drones (2)
  {
    id: 'a1b2c3d4-9999-9999-9999-000000000009', // drone-9 (Dove-9)
    name: 'Dove-9',
    model: 'Perch drones V1',
    base_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', // SF base
    status: 'not charging',
    user_id: 'user-1',
    last_check_in: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
  },
  {
    id: 'a1b2c3d4-aaaa-aaaa-aaaa-00000000000a', // drone-10 (Crow-10)
    name: 'Crow-10',
    model: 'Perch drones V1',
    base_id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8', // NY base
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
    'a1b2c3d4-1111-1111-1111-000000000001': 92, // Falcon-1
    'a1b2c3d4-2222-2222-2222-000000000002': 85, // Eagle-2
    'a1b2c3d4-3333-3333-3333-000000000003': 78, // Hawk-3
    'a1b2c3d4-4444-4444-4444-000000000004': 95, // Raven-4
    'a1b2c3d4-5555-5555-5555-000000000005': 65, // Phoenix-5
    'a1b2c3d4-6666-6666-6666-000000000006': 70, // Griffin-6
    'a1b2c3d4-7777-7777-7777-000000000007': 88, // Sparrow-7
    'a1b2c3d4-8888-8888-8888-000000000008': 72, // Swift-8
    'a1b2c3d4-9999-9999-9999-000000000009': 45, // Dove-9
    'a1b2c3d4-aaaa-aaaa-aaaa-00000000000a': 30, // Crow-10
  }
  return batteryMap[droneId] || 100
}

/**
 * Helper function to get location name from coordinates
 */
export function getLocationName(base: Base): string {
  const locationMap: Record<string, string> = {
    'f47ac10b-58cc-4372-a567-0e02b2c3d479': 'San Francisco, CA', // SF base
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8': 'Austin, TX', // Austin base
    '6ba7b811-9dad-11d1-80b4-00c04fd430c8': 'New York, NY', // NY base
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
    id: '11111111-1111-1111-1111-000000000001',
    drone_id: 'a1b2c3d4-1111-1111-1111-000000000001', // Falcon-1
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
    id: '22222222-2222-2222-2222-000000000002',
    drone_id: 'a1b2c3d4-5555-5555-5555-000000000005', // Phoenix-5
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
    id: '33333333-3333-3333-3333-000000000003',
    drone_id: 'a1b2c3d4-3333-3333-3333-000000000003', // Hawk-3
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
    id: '44444444-4444-4444-4444-000000000004',
    drone_id: 'a1b2c3d4-4444-4444-4444-000000000004', // Raven-4
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
    id: '55555555-5555-5555-5555-000000000005',
    drone_id: 'a1b2c3d4-6666-6666-6666-000000000006', // Griffin-6
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
    id: '66666666-6666-6666-6666-000000000006',
    drone_id: 'a1b2c3d4-7777-7777-7777-000000000007', // Sparrow-7
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

