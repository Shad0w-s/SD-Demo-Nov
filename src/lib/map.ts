// Map utilities with ArcGIS primary and OSM/Leaflet fallback
// Only import on client side to avoid SSR issues

export type MapType = 'arcgis' | 'osm'

export interface MapInstance {
  type: MapType
  // ArcGIS instance
  map?: any // ArcGIS Map
  view?: any // ArcGIS MapView
  graphicsLayer?: any // ArcGIS GraphicsLayer
  // OSM/Leaflet instance (fallback)
  leafletMap?: any // Leaflet Map
  markers: any[]
  pathLayer: any | null
  // Common methods
  remove: () => void
  whenReady: (callback: () => void) => void
}

// ArcGIS implementation
async function initializeArcGISMap(container: HTMLDivElement): Promise<MapInstance> {
  if (typeof window === 'undefined') {
    throw new Error('ArcGIS requires browser environment')
  }

  try {
    // Dynamically import ArcGIS modules
    const [
      Map,
      MapView,
      GraphicsLayer,
      esriConfig,
    ] = await Promise.all([
      import('@arcgis/core/Map'),
      import('@arcgis/core/views/MapView'),
      import('@arcgis/core/layers/GraphicsLayer'),
      import('@arcgis/core/config'),
    ])

    // Configure API key
    const apiKey = process.env.NEXT_PUBLIC_ARCGIS_API_KEY
    if (apiKey) {
      esriConfig.default.apiKey = apiKey
    }

    // Create map
    const map = new Map.default({
      basemap: 'streets-navigation-vector',
    })

    // Create graphics layer for markers and paths
    const graphicsLayer = new GraphicsLayer.default()
    map.add(graphicsLayer)

    // Create map view
    const view = new MapView.default({
      container,
      map,
      center: [-122.4194, 37.7749], // San Francisco [lng, lat]
      zoom: 13,
    })

    // Wait for view to be ready
    await view.when()

    const instance: MapInstance = {
      type: 'arcgis',
      map,
      view,
      graphicsLayer,
      markers: [],
      pathLayer: null,
      remove: () => {
        if (view) {
          view.destroy()
        }
      },
      whenReady: (callback: () => void) => {
        view.when().then(callback)
      },
    }

    return instance
  } catch (error) {
    console.error('ArcGIS initialization failed:', error)
    throw error
  }
}

// OSM/Leaflet fallback implementation
function initializeOSMMap(container: HTMLDivElement): MapInstance {
  if (typeof window === 'undefined') {
    throw new Error('Leaflet requires browser environment')
  }

  // Dynamically require Leaflet
  const L = require('leaflet')

  // Fix for default marker icon issue in Leaflet
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })

  const map = L.map(container, {
    center: [37.7749, -122.4194], // San Francisco [lat, lng] for Leaflet
    zoom: 13,
    zoomControl: true,
    attributionControl: true,
  })

  // Use OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors',
  }).addTo(map)

  const instance: MapInstance = {
    type: 'osm',
    leafletMap: map,
    markers: [],
    pathLayer: null,
    remove: () => {
      if (map) {
        map.remove()
      }
    },
    whenReady: (callback: () => void) => {
      map.whenReady(callback)
    },
  }

  return instance
}

// Main initialization function with fallback
export async function initializeMap(container: HTMLDivElement): Promise<MapInstance> {
  if (typeof window === 'undefined') {
    throw new Error('Map initialization requires browser environment')
  }

  try {
    // Try ArcGIS first
    return await initializeArcGISMap(container)
  } catch (error) {
    console.warn('ArcGIS initialization failed, falling back to OSM:', error)
    // Fallback to OSM/Leaflet
    return initializeOSMMap(container)
  }
}

// Base marker functions
export async function addBaseMarker(
  mapInstance: MapInstance,
  base: { name: string; lat: number; lng: number },
  color: string = '#3b82f6'
) {
  if (mapInstance.type === 'arcgis') {
    // ArcGIS implementation
    const [
      Point,
      Graphic,
      SimpleMarkerSymbol,
    ] = await Promise.all([
      import('@arcgis/core/geometry/Point'),
      import('@arcgis/core/Graphic'),
      import('@arcgis/core/symbols/SimpleMarkerSymbol'),
    ])

    const point = new Point.default({
      longitude: base.lng,
      latitude: base.lat,
    })

    const symbol = new SimpleMarkerSymbol.default({
      style: 'circle',
      color: color,
      size: 24,
      outline: {
        color: 'white',
        width: 3,
      },
    })

    const graphic = new Graphic.default({
      geometry: point,
      symbol,
      attributes: {
        name: base.name,
        type: 'base',
      },
      popupTemplate: {
        title: `Base: ${base.name}`,
        content: `Lat: ${base.lat}<br>Lng: ${base.lng}`,
      },
    })

    mapInstance.graphicsLayer!.add(graphic)
    mapInstance.markers.push(graphic)

    return graphic
  } else {
    // OSM/Leaflet implementation
    const L = require('leaflet')
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: 24px;
        height: 24px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })

    const marker = L.marker([base.lat, base.lng], { icon })
      .addTo(mapInstance.leafletMap!)
      .bindPopup(`<strong>Base:</strong> ${base.name}`)

    mapInstance.markers.push(marker)
    return marker
  }
}

// Drone marker functions
export async function addDroneMarker(
  mapInstance: MapInstance,
  drone: { name: string; id?: string },
  position: [number, number],
  color: string = '#10b981'
) {
  if (mapInstance.type === 'arcgis') {
    // ArcGIS implementation
    const [
      Point,
      Graphic,
      SimpleMarkerSymbol,
    ] = await Promise.all([
      import('@arcgis/core/geometry/Point'),
      import('@arcgis/core/Graphic'),
      import('@arcgis/core/symbols/SimpleMarkerSymbol'),
    ])

    const point = new Point.default({
      longitude: position[0], // [lng, lat] format
      latitude: position[1],
    })

    const symbol = new SimpleMarkerSymbol.default({
      style: 'triangle',
      color: color,
      size: 24,
      angle: 0,
      outline: {
        color: 'white',
        width: 2,
      },
    })

    const graphic = new Graphic.default({
      geometry: point,
      symbol,
      attributes: {
        name: drone.name,
        id: drone.id,
        type: 'drone',
      },
      popupTemplate: {
        title: `Drone: ${drone.name}`,
        content: `Lat: ${position[1]}<br>Lng: ${position[0]}`,
      },
    })

    mapInstance.graphicsLayer!.add(graphic)
    mapInstance.markers.push(graphic)

    return graphic
  } else {
    // OSM/Leaflet implementation
    const L = require('leaflet')
    const icon = L.divIcon({
      className: 'custom-drone-marker',
      html: `<div style="
        width: 0;
        height: 0;
        border-left: 12px solid transparent;
        border-right: 12px solid transparent;
        border-bottom: 20px solid ${color};
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      "></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 20],
    })

    // Leaflet uses [lat, lng], our position is [lng, lat]
    const marker = L.marker([position[1], position[0]], { icon })
      .addTo(mapInstance.leafletMap!)
      .bindPopup(`<strong>Drone:</strong> ${drone.name}`)

    mapInstance.markers.push(marker)
    return marker
  }
}

// Path drawing functions
export async function addPathToMap(
  mapInstance: MapInstance,
  path: [number, number][],
  color: string = '#8b5cf6'
) {
  // Remove existing path
  if (mapInstance.pathLayer) {
    await clearPath(mapInstance)
  }

  if (mapInstance.type === 'arcgis') {
    // ArcGIS implementation
    const [
      Polyline,
      Graphic,
      SimpleLineSymbol,
    ] = await Promise.all([
      import('@arcgis/core/geometry/Polyline'),
      import('@arcgis/core/Graphic'),
      import('@arcgis/core/symbols/SimpleLineSymbol'),
    ])

    // Convert path to ArcGIS format [lng, lat] (already in correct format)
    const paths = path.map(([lng, lat]) => [lng, lat])

    const polyline = new Polyline.default({
      paths: [paths],
      spatialReference: { wkid: 4326 },
    })

    const symbol = new SimpleLineSymbol.default({
      style: 'solid',
      color: color,
      width: 4,
    })

    const graphic = new Graphic.default({
      geometry: polyline,
      symbol,
    })

    mapInstance.graphicsLayer!.add(graphic)
    mapInstance.pathLayer = graphic

    // Fit view to path
    if (path.length > 0) {
      await mapInstance.view!.goTo(polyline.extent.expand(1.5))
    }

    return graphic
  } else {
    // OSM/Leaflet implementation
    const L = require('leaflet')
    // Convert [lng, lat] to [lat, lng] for Leaflet
    const latLngs = path.map(([lng, lat]) => [lat, lng] as [number, number])

    const polyline = L.polyline(latLngs, {
      color,
      weight: 4,
      opacity: 0.8,
      smoothFactor: 1,
    }).addTo(mapInstance.leafletMap!)

    mapInstance.pathLayer = polyline

    // Fit map to path bounds
    if (latLngs.length > 0) {
      mapInstance.leafletMap!.fitBounds(latLngs)
    }

    return polyline
  }
}

export async function clearPath(mapInstance: MapInstance) {
  if (mapInstance.pathLayer) {
    if (mapInstance.type === 'arcgis') {
      mapInstance.graphicsLayer!.remove(mapInstance.pathLayer)
    } else {
      mapInstance.leafletMap!.removeLayer(mapInstance.pathLayer)
    }
    mapInstance.pathLayer = null
  }
}

export function clearMarkers(mapInstance: MapInstance) {
  if (mapInstance.type === 'arcgis') {
    mapInstance.markers.forEach((marker) => {
      mapInstance.graphicsLayer!.remove(marker)
    })
  } else {
    mapInstance.markers.forEach((marker) => {
      mapInstance.leafletMap!.removeLayer(marker)
    })
  }
  mapInstance.markers = []
}

export async function updateDronePosition(
  mapInstance: MapInstance,
  marker: any,
  position: [number, number]
) {
  if (mapInstance.type === 'arcgis') {
    const Point = (await import('@arcgis/core/geometry/Point')).default
    marker.geometry = new Point({
      longitude: position[0],
      latitude: position[1],
    })
  } else {
    // Leaflet uses [lat, lng]
    marker.setLatLng([position[1], position[0]])
  }
}
