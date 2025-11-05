import { getAccessToken } from './supabaseClient'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'

async function getAuthToken(): Promise<string | null> {
  return await getAccessToken()
}

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = await getAuthToken()
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`)
  }

  return response.json()
}

// API methods
export const api = {
  getDrones: () => apiRequest('/api/drones'),
  createDrone: (data: any) => apiRequest('/api/drones', { method: 'POST', body: JSON.stringify(data) }),
  getBases: () => apiRequest('/api/bases'),
  createBase: (data: any) => apiRequest('/api/bases', { method: 'POST', body: JSON.stringify(data) }),
  simulatePath: (droneId: string, path: any) => 
    apiRequest(`/api/drones/${droneId}/simulate_path`, { method: 'POST', body: JSON.stringify(path) }),
  droneAction: (droneId: string, action: string) =>
    apiRequest(`/api/drones/${droneId}/action`, { method: 'POST', body: JSON.stringify({ action }) }),
}

