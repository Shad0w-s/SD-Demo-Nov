// ArcGIS utility functions for map management
import Map from '@arcgis/core/Map'
import MapView from '@arcgis/core/views/MapView'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import Graphic from '@arcgis/core/Graphic'
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol'
import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol'
import Point from '@arcgis/core/geometry/Point'
import Polyline from '@arcgis/core/geometry/Polyline'
import Color from '@arcgis/core/Color'

export interface MapInstance {
  map: Map
  view: MapView
  graphicsLayer: GraphicsLayer
}

export function initializeMap(container: HTMLDivElement): MapInstance {
  const map = new Map({
    basemap: 'streets-vector',
  })

  const view = new MapView({
    container,
    map,
    center: [-122.4, 37.79], // San Francisco default
    zoom: 13,
  })

  const graphicsLayer = new GraphicsLayer()
  map.add(graphicsLayer)

  return { map, view, graphicsLayer }
}

export function addBaseMarker(
  graphicsLayer: GraphicsLayer,
  base: { name: string; lat: number; lng: number },
  color: string = '#3b82f6'
) {
  const point = new Point({
    longitude: base.lng,
    latitude: base.lat,
  })

  const markerSymbol = new SimpleMarkerSymbol({
    style: 'circle',
    color: new Color(color),
    size: 12,
    outline: {
      color: new Color('#ffffff'),
      width: 2,
    },
  })

  const graphic = new Graphic({
    geometry: point,
    symbol: markerSymbol,
    attributes: { name: base.name, type: 'base' },
  })

  graphicsLayer.add(graphic)
  return graphic
}

export function addDroneMarker(
  graphicsLayer: GraphicsLayer,
  drone: { name: string; lat?: number; lng?: number },
  position: [number, number],
  color: string = '#10b981'
) {
  const point = new Point({
    longitude: position[0],
    latitude: position[1],
  })

  const markerSymbol = new SimpleMarkerSymbol({
    style: 'triangle',
    color: new Color(color),
    size: 16,
    angle: 0,
    outline: {
      color: new Color('#ffffff'),
      width: 2,
    },
  })

  const graphic = new Graphic({
    geometry: point,
    symbol: markerSymbol,
    attributes: { name: drone.name, type: 'drone' },
  })

  graphicsLayer.add(graphic)
  return graphic
}

export function addPathToMap(
  graphicsLayer: GraphicsLayer,
  path: [number, number][],
  color: string = '#8b5cf6'
) {
  const polyline = new Polyline({
    paths: [path],
    spatialReference: { wkid: 4326 },
  })

  const lineSymbol = new SimpleLineSymbol({
    style: 'solid',
    color: new Color(color),
    width: 3,
  })

  const graphic = new Graphic({
    geometry: polyline,
    symbol: lineSymbol,
    attributes: { type: 'path' },
  })

  graphicsLayer.add(graphic)
  return graphic
}

export function updateDronePosition(
  graphicsLayer: GraphicsLayer,
  droneId: string,
  position: [number, number]
) {
  // Find and update existing drone graphic
  const graphics = graphicsLayer.graphics
  const droneGraphic = graphics.find(
    (g) => g.attributes?.type === 'drone' && g.attributes?.id === droneId
  )

  if (droneGraphic) {
    const point = new Point({
      longitude: position[0],
      latitude: position[1],
    })
    droneGraphic.geometry = point
  }
}

export function clearPath(graphicsLayer: GraphicsLayer) {
  const graphics = graphicsLayer.graphics
  graphics.filter((g) => g.attributes?.type === 'path').forEach((g) => {
    graphicsLayer.remove(g)
  })
}
