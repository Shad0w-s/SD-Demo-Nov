import { create } from 'zustand'

export interface Drone {
  id: string
  name: string
  model?: string
  status: string
  base_id?: string
  user_id?: string
  last_check_in?: string
  created_at?: string
}

export interface Base {
  id: string
  name: string
  lat: number
  lng: number
  created_at?: string
}

export interface Schedule {
  id: string
  drone_id: string
  start_time: string
  end_time?: string
  path_json?: any
  created_at?: string
}

interface SimulationState {
  isRunning: boolean
  speed?: number
  eta?: number
  telemetry?: {
    battery_level: number
    altitude_m: number
    heading_deg: number
    signal_strength: number
  }
}

interface AppState {
  drones: Drone[]
  bases: Base[]
  schedules: Schedule[]
  selectedDrone: Drone | null
  selectedBase: Base | null
  currentPath: [number, number][] | null
  simulation: SimulationState | null
  isLoading: boolean
  error: string | null
  setDrones: (drones: Drone[]) => void
  setBases: (bases: Base[]) => void
  setSchedules: (schedules: Schedule[]) => void
  setSelectedDrone: (drone: Drone | null) => void
  setSelectedBase: (base: Base | null) => void
  setCurrentPath: (path: [number, number][] | null) => void
  setSimulation: (simulation: SimulationState | null) => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  addDrone: (drone: Drone) => void
  updateDrone: (id: string, updates: Partial<Drone>) => void
  removeDrone: (id: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  drones: [],
  bases: [],
  schedules: [],
  selectedDrone: null,
  selectedBase: null,
  currentPath: null,
  simulation: null,
  isLoading: false,
  error: null,
  setDrones: (drones) => set({ drones }),
  setBases: (bases) => set({ bases }),
  setSchedules: (schedules) => set({ schedules }),
  setSelectedDrone: (drone) => set({ selectedDrone: drone }),
  setSelectedBase: (base) => set({ selectedBase: base }),
  setCurrentPath: (path) => set({ currentPath: path }),
  setSimulation: (simulation) => set({ simulation }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  addDrone: (drone) => set((state) => ({ drones: [...state.drones, drone] })),
  updateDrone: (id, updates) =>
    set((state) => ({
      drones: state.drones.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    })),
  removeDrone: (id) =>
    set((state) => ({ drones: state.drones.filter((d) => d.id !== id) })),
}))

