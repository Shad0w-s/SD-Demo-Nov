// Test setup file
import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock ArcGIS Maps SDK for testing
vi.mock('@arcgis/core/Map', () => ({
  default: vi.fn().mockImplementation(() => ({
    add: vi.fn(),
    remove: vi.fn(),
  })),
}))

vi.mock('@arcgis/core/views/MapView', () => ({
  default: vi.fn().mockImplementation(() => ({
    when: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(() => ({ off: vi.fn() })),
    off: vi.fn(),
    destroy: vi.fn(),
    goTo: vi.fn().mockResolvedValue(undefined),
  })),
}))

vi.mock('@arcgis/core/layers/GraphicsLayer', () => ({
  default: vi.fn().mockImplementation(() => ({
    add: vi.fn(),
    remove: vi.fn(),
  })),
}))

vi.mock('@arcgis/core/Graphic', () => ({
  default: vi.fn().mockImplementation((props) => ({
    ...props,
    geometry: props.geometry,
    symbol: props.symbol,
    attributes: props.attributes,
  })),
}))

vi.mock('@arcgis/core/geometry/Point', () => ({
  default: vi.fn().mockImplementation((props) => ({
    longitude: props.longitude,
    latitude: props.latitude,
    spatialReference: { wkid: 4326 },
  })),
}))

vi.mock('@arcgis/core/geometry/Polyline', () => ({
  default: vi.fn().mockImplementation((props) => ({
    paths: props.paths,
    spatialReference: props.spatialReference,
    extent: {
      expand: vi.fn().mockReturnThis(),
    },
  })),
}))

vi.mock('@arcgis/core/symbols/SimpleMarkerSymbol', () => ({
  default: vi.fn().mockImplementation((props) => ({
    ...props,
  })),
}))

vi.mock('@arcgis/core/symbols/SimpleLineSymbol', () => ({
  default: vi.fn().mockImplementation((props) => ({
    ...props,
  })),
}))

vi.mock('@arcgis/core/config', () => ({
  default: {
    apiKey: null,
  },
}))

// Mock Leaflet for testing (fallback)
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
    marker: vi.fn(() => ({ addTo: vi.fn(), bindPopup: vi.fn(), setLatLng: vi.fn() })),
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
  initializeMap: vi.fn(async () => ({
    type: 'arcgis',
    map: {
      add: vi.fn(),
      remove: vi.fn(),
    },
    view: {
      when: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(() => ({ off: vi.fn() })),
      off: vi.fn(),
      destroy: vi.fn(),
      goTo: vi.fn().mockResolvedValue(undefined),
    },
    graphicsLayer: {
      add: vi.fn(),
      remove: vi.fn(),
    },
    markers: [],
    pathLayer: null,
    remove: vi.fn(),
    whenReady: vi.fn((callback) => callback()),
  })),
  addBaseMarker: vi.fn(),
  addDroneMarker: vi.fn(),
  addPathToMap: vi.fn(),
  clearPath: vi.fn(),
  clearMarkers: vi.fn(),
  updateDronePosition: vi.fn(),
}))
