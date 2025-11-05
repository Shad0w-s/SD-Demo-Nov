import { create } from 'zustand'

interface Drone {
  id: string
  name: string
  model?: string
  status: string
  base_id?: string
}

interface Base {
  id: string
  name: string
  lat: number
  lng: number
}

interface AppState {
  drones: Drone[]
  bases: Base[]
  selectedDrone: Drone | null
  currentPath: [number, number][] | null
  setDrones: (drones: Drone[]) => void
  setBases: (bases: Base[]) => void
  setSelectedDrone: (drone: Drone | null) => void
  setCurrentPath: (path: [number, number][] | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  drones: [],
  bases: [],
  selectedDrone: null,
  currentPath: null,
  setDrones: (drones) => set({ drones }),
  setBases: (bases) => set({ bases }),
  setSelectedDrone: (drone) => set({ selectedDrone: drone }),
  setCurrentPath: (path) => set({ currentPath: path }),
}))

