// Test setup file
import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock Leaflet for testing
vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => ({
      whenReady: vi.fn((callback) => callback()),
      on: vi.fn(() => ({ off: vi.fn() })),
      off: vi.fn(),
      remove: vi.fn(),
      fitBounds: vi.fn(),
      removeLayer: vi.fn(),
    })),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    marker: vi.fn(() => ({ addTo: vi.fn(), bindPopup: vi.fn() })),
    polyline: vi.fn(() => ({ addTo: vi.fn() })),
    divIcon: vi.fn(),
    Icon: {
      Default: {
        prototype: {},
        mergeOptions: vi.fn(),
      },
    },
  },
}))

// Mock map utilities
vi.mock('@/lib/map', () => ({
  initializeMap: vi.fn(() => ({
    map: {
      whenReady: vi.fn((callback) => callback()),
      on: vi.fn(() => ({ off: vi.fn() })),
      off: vi.fn(),
      remove: vi.fn(),
    },
    markers: [],
    pathLayer: null,
  })),
  addBaseMarker: vi.fn(),
  addDroneMarker: vi.fn(),
  addPathToMap: vi.fn(),
  clearPath: vi.fn(),
  clearMarkers: vi.fn(),
  updateDronePosition: vi.fn(),
}))

