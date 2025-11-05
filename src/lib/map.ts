// Map utilities with OSM/Leaflet fallback
// Only import Leaflet on client side
let L: any = null
if (typeof window !== 'undefined') {
  L = require('leaflet')
}

export interface MapInstance {
  map: L.Map
  markers: L.Marker[]
  pathLayer: L.Polyline | null
}

export function initializeMap(container: HTMLDivElement): MapInstance {
  if (!L || typeof window === 'undefined') {
    throw new Error('Leaflet is not available')
  }

  // Fix for default marker icon issue in Leaflet
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })

  const map = L.map(container, {
    center: [37.7749, -122.4194], // San Francisco default
    zoom: 13,
    zoomControl: true,
    attributionControl: true,
  })

  // Use OpenStreetMap tiles (free, no API key needed)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors',
  }).addTo(map)

  return {
    map,
    markers: [],
    pathLayer: null,
  }
}

export function addBaseMarker(
  mapInstance: MapInstance,
  base: { name: string; lat: number; lng: number },
  color: string = '#3b82f6'
) {
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
    .addTo(mapInstance.map)
    .bindPopup(`<strong>Base:</strong> ${base.name}`)

  mapInstance.markers.push(marker)
  return marker
}

export function addDroneMarker(
  mapInstance: MapInstance,
  drone: { name: string; lat?: number; lng?: number },
  position: [number, number],
  color: string = '#10b981'
) {
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

  const marker = L.marker([position[1], position[0]], { icon })
    .addTo(mapInstance.map)
    .bindPopup(`<strong>Drone:</strong> ${drone.name}`)

  mapInstance.markers.push(marker)
  return marker
}

export function addPathToMap(
  mapInstance: MapInstance,
  path: [number, number][],
  color: string = '#8b5cf6'
) {
  // Remove existing path
  if (mapInstance.pathLayer) {
    mapInstance.map.removeLayer(mapInstance.pathLayer)
  }

  // Convert [lng, lat] to [lat, lng] for Leaflet
  const latLngs = path.map(([lng, lat]) => [lat, lng] as [number, number])

  const polyline = L.polyline(latLngs, {
    color,
    weight: 4,
    opacity: 0.8,
    smoothFactor: 1,
  }).addTo(mapInstance.map)

  // Fit map to path bounds
  if (latLngs.length > 0) {
    mapInstance.map.fitBounds(latLngs)
  }

  mapInstance.pathLayer = polyline
  return polyline
}

export function clearPath(mapInstance: MapInstance) {
  if (mapInstance.pathLayer) {
    mapInstance.map.removeLayer(mapInstance.pathLayer)
    mapInstance.pathLayer = null
  }
}

export function clearMarkers(mapInstance: MapInstance) {
  mapInstance.markers.forEach((marker) => {
    mapInstance.map.removeLayer(marker)
  })
  mapInstance.markers = []
}

export function updateDronePosition(
  mapInstance: MapInstance,
  marker: L.Marker,
  position: [number, number]
) {
  marker.setLatLng([position[1], position[0]])
}

