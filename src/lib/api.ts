import { getAccessToken } from './supabaseClient'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'

export interface ApiError {
  message: string
  status?: number
}

// Create AbortController for timeout
function createTimeoutController(timeoutMs: number = 2000): AbortController {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), timeoutMs)
  return controller
}

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = 2000
): Promise<any> {
  try {
    const token = await getAccessToken()
    const controller = createTimeoutController(timeoutMs)
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }))
      const error: ApiError = {
        message: errorData.error || errorData.message || response.statusText,
        status: response.status,
      }
      throw error
    }

    return response.json()
  } catch (error) {
    if (error instanceof Error) {
      // Handle timeout/abort errors
      if (error.name === 'AbortError') {
        const apiError: ApiError = {
          message: 'Request timeout - using cached data',
          status: 408,
        }
        throw apiError
      }
      const apiError: ApiError = {
        message: error.message,
      }
      throw apiError
    }
    throw error
  }
}

// API methods
export const api = {
  // Drones
  getDrones: () => apiRequest('/api/drones'),
  getDrone: (id: string) => apiRequest(`/api/drones/${id}`),
  createDrone: (data: { name: string; model?: string; base_id?: string; status?: string }) =>
    apiRequest('/api/drones', { method: 'POST', body: JSON.stringify(data) }),
  updateDrone: (id: string, data: Partial<{ name: string; model: string; status: string; base_id: string }>) =>
    apiRequest(`/api/drones/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDrone: (id: string) =>
    apiRequest(`/api/drones/${id}`, { method: 'DELETE' }),
  
  // Bases
  getBases: () => apiRequest('/api/bases'),
  getBase: (id: string) => apiRequest(`/api/bases/${id}`),
  createBase: (data: { name: string; lat: number; lng: number }) =>
    apiRequest('/api/bases', { method: 'POST', body: JSON.stringify(data) }),
  updateBase: (id: string, data: Partial<{ name: string; lat: number; lng: number }>) =>
    apiRequest(`/api/bases/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBase: (id: string) =>
    apiRequest(`/api/bases/${id}`, { method: 'DELETE' }),
  
  // Schedules
  getSchedules: () => apiRequest('/api/schedules'),
  getSchedule: (id: string) => apiRequest(`/api/schedules/${id}`),
  createSchedule: (data: { drone_id: string; start_time: string; end_time?: string; path_json?: any }) =>
    apiRequest('/api/schedules', { method: 'POST', body: JSON.stringify(data) }),
  updateSchedule: (id: string, data: Partial<{ start_time: string; end_time: string; path_json: any }>) =>
    apiRequest(`/api/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSchedule: (id: string) =>
    apiRequest(`/api/schedules/${id}`, { method: 'DELETE' }),
  
  // Simulation
  simulatePath: (droneId: string, path?: { path?: [number, number][] }) =>
    apiRequest(`/api/drones/${droneId}/simulate_path`, {
      method: 'POST',
      body: JSON.stringify(path || {}),
    }),
  droneAction: (droneId: string, action: string) =>
    apiRequest(`/api/drones/${droneId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),
}
