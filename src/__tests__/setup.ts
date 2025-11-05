// Test setup file
import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock ArcGIS before any imports
vi.mock('@arcgis/core', () => ({
  Map: class MockMap {},
  MapView: class MockMapView {},
  GraphicsLayer: class MockGraphicsLayer {
    graphics = { filter: () => [], find: () => null }
    add = vi.fn()
    remove = vi.fn()
  },
  Graphic: class MockGraphic {},
  SimpleMarkerSymbol: class MockSimpleMarkerSymbol {},
  SimpleLineSymbol: class MockSimpleLineSymbol {},
  Point: class MockPoint {},
  Polyline: class MockPolyline {},
  Color: class MockColor {},
}))

// Mock arcgis module
vi.mock('@/lib/arcgis', () => ({
  initializeMap: vi.fn(() => ({
    map: {},
    view: {
      destroy: vi.fn(),
      on: vi.fn(() => ({ remove: vi.fn() })),
      toMap: vi.fn(() => ({ longitude: -122.4, latitude: 37.79 })),
    },
    graphicsLayer: {
      graphics: { filter: () => [], find: () => null },
      add: vi.fn(),
      remove: vi.fn(),
    },
  })),
  addBaseMarker: vi.fn(),
  addDroneMarker: vi.fn(),
  addPathToMap: vi.fn(),
  clearPath: vi.fn(),
  updateDronePosition: vi.fn(),
}))

