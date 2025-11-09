// Map utilities - ArcGIS only
// Only import on client side to avoid SSR issues

export type MapType = 'arcgis'

export interface MapInstance {
  type: MapType
  // ArcGIS instance
  map: any // ArcGIS Map
  view: any // ArcGIS MapView
  graphicsLayer: any // ArcGIS GraphicsLayer
  markers: any[]
  pathLayer: any | null
  pathMarkers: any[]
  pathAnimationTimer: number | null
  // Common methods
  remove: () => void
  whenReady: (callback: () => void) => void
  centerOn: (lng: number, lat: number, zoom?: number) => Promise<void>
}

// ArcGIS implementation with retry logic
async function initializeArcGISMap(container: HTMLDivElement, retryCount = 0, maxRetries = 2): Promise<MapInstance> {
  console.log(`[ArcGIS] Starting initialization (attempt ${retryCount + 1}/${maxRetries + 1})...`)
  console.log('[ArcGIS] Container element:', container ? `present (${container.offsetWidth}x${container.offsetHeight})` : 'missing')
  
  if (typeof window === 'undefined') {
    console.error('[ArcGIS] ❌ Browser environment check failed')
    throw new Error('ArcGIS requires browser environment')
  }

  // Verify container has dimensions
  if (container && (container.offsetWidth === 0 || container.offsetHeight === 0)) {
    console.warn('[ArcGIS] ⚠️ Container has zero dimensions. This may cause rendering issues.')
    console.warn('[ArcGIS] Container dimensions:', `${container.offsetWidth}x${container.offsetHeight}`)
  }

  try {
    console.log('[ArcGIS] Importing ArcGIS modules...')
    const importStartTime = performance.now()
    
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
    
    const importDuration = performance.now() - importStartTime
    console.log(`[ArcGIS] ✅ Modules imported successfully (${importDuration.toFixed(2)}ms)`)

    // Configure API key
    const apiKey = process.env.NEXT_PUBLIC_ARCGIS_API_KEY
    const hasApiKey = !!apiKey
    const apiKeyLength = apiKey?.length || 0
    console.log(`[ArcGIS] API Key status: ${hasApiKey ? `present (${apiKeyLength} chars)` : 'missing'}`)
    
    if (apiKey) {
      // Basic validation: ArcGIS API keys are typically 32-40 characters
      if (apiKeyLength < 20 || apiKeyLength > 50) {
        console.warn(`[ArcGIS] ⚠️ API key length (${apiKeyLength}) seems unusual. Expected 32-40 characters.`)
      }
      esriConfig.default.apiKey = apiKey
      console.log('[ArcGIS] ✅ API key configured')
    } else {
      console.warn('[ArcGIS] ⚠️ NEXT_PUBLIC_ARCGIS_API_KEY is not set. ArcGIS may have limited functionality.')
    }

    console.log('[ArcGIS] Creating Map instance...')
    // Create map - use satellite basemap (raster, reliable)
    // Vector basemaps require additional service permissions that may not be available
    const map = new Map.default({
      basemap: 'hybrid',
    })
    console.log('[ArcGIS] ✅ Map instance created')

    console.log('[ArcGIS] Creating GraphicsLayer...')
    // Create graphics layer for markers and paths
    const graphicsLayer = new GraphicsLayer.default()
    map.add(graphicsLayer)
    console.log('[ArcGIS] ✅ GraphicsLayer created and added to map')

    console.log('[ArcGIS] Creating MapView...')
    // Create map view
    const view = new MapView.default({
      container,
      map,
      center: [-122.4194, 37.7749], // San Francisco [lng, lat]
      zoom: 13,
    })
    console.log('[ArcGIS] ✅ MapView created')

    console.log('[ArcGIS] Waiting for view to be ready...')
    const viewReadyStartTime = performance.now()
    
    // Wait for view to be ready (no timeout - let it complete naturally)
    await view.when()
    const viewReadyDuration = performance.now() - viewReadyStartTime
    console.log(`[ArcGIS] ✅ View ready (${viewReadyDuration.toFixed(2)}ms)`)
    console.log(`[ArcGIS] View dimensions: ${view.width}x${view.height}`)
    
    // Verify view has valid dimensions
    if (view.width === 0 || view.height === 0) {
      console.warn('[ArcGIS] ⚠️ View has zero dimensions. Map may not render correctly.')
      console.warn('[ArcGIS] This might indicate a CSS/layout issue with the container.')
    }

    // Don't explicitly load basemap - let view.when() handle it naturally
    // Explicit loading can cause issues with vector tile layers

    const instance: MapInstance = {
      type: 'arcgis',
      map,
      view,
      graphicsLayer,
      markers: [],
      pathLayer: null,
      pathMarkers: [],
      pathAnimationTimer: null,
      remove: () => {
        if (view) {
          view.destroy()
        }
      },
      whenReady: (callback: () => void) => {
        view.when().then(callback)
      },
      centerOn: async (lng: number, lat: number, zoom?: number) => {
        await view.when()
        const Point = (await import('@arcgis/core/geometry/Point')).default
        const center = new Point({ longitude: lng, latitude: lat })
        await view.goTo({
          center,
          zoom: zoom || view.zoom,
        }, { duration: 1000 })
      },
    }

    console.log('[ArcGIS] ✅ MapInstance created successfully')
    return instance
  } catch (error) {
    console.error(`[ArcGIS] ❌ Initialization failed (attempt ${retryCount + 1}):`, error)
    if (error instanceof Error) {
      console.error('[ArcGIS] Error name:', error.name)
      console.error('[ArcGIS] Error message:', error.message)
      if (error.stack) {
        console.error('[ArcGIS] Error stack:', error.stack)
      }
      
      // Retry on network errors or module loading failures
      const isRetryableError = 
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('timeout') ||
        error.message.includes('import') ||
        error.name === 'TypeError'
      
      if (isRetryableError && retryCount < maxRetries) {
        const delay = (retryCount + 1) * 1000 // Exponential backoff: 1s, 2s
        console.log(`[ArcGIS] 🔄 Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        return initializeArcGISMap(container, retryCount + 1, maxRetries)
      }
    }
    throw error
  }
}


// Validate API key format
function validateApiKey(apiKey: string | undefined): { valid: boolean; reason?: string } {
  if (!apiKey) {
    return { valid: false, reason: 'API key is missing' }
  }
  if (apiKey.trim().length === 0) {
    return { valid: false, reason: 'API key is empty' }
  }
  if (apiKey.length < 20 || apiKey.length > 50) {
    return { valid: false, reason: `API key length (${apiKey.length}) is unusual. Expected 32-40 characters.` }
  }
  return { valid: true }
}

// Main initialization function - ArcGIS only
export async function initializeMap(container: HTMLDivElement): Promise<MapInstance> {
  console.log('[Map] ===== ArcGIS Map Initialization Started =====')
  console.log('[Map] Container:', container ? `present (${container.offsetWidth}x${container.offsetHeight})` : 'missing')
  
  if (typeof window === 'undefined') {
    console.error('[Map] ❌ Browser environment check failed')
    throw new Error('Map initialization requires browser environment')
  }

  // API key is required - throw error if not set
  const apiKey = process.env.NEXT_PUBLIC_ARCGIS_API_KEY
  const apiKeyValidation = validateApiKey(apiKey)
  
  if (!apiKey || !apiKeyValidation.valid) {
    const errorMsg = `NEXT_PUBLIC_ARCGIS_API_KEY ${apiKeyValidation.reason || 'is not set'}. ArcGIS API key is required.`
    console.error(`[Map] ❌ ${errorMsg}`)
    console.error('[Map] 💡 Set NEXT_PUBLIC_ARCGIS_API_KEY in .env.local and restart the dev server')
    throw new Error(errorMsg)
  }

  console.log('[Map] Initializing ArcGIS map...')
  try {
    // Initialize ArcGIS with extended timeout to allow for basemap loading
    const initPromise = initializeArcGISMap(container)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('ArcGIS initialization timeout after 30 seconds')), 30000)
    })
    
    const instance = await Promise.race([initPromise, timeoutPromise])
    console.log('[Map] ✅ ArcGIS map initialized successfully')
    return instance
  } catch (error) {
    console.error('[Map] ❌ ArcGIS initialization failed')
    if (error instanceof Error) {
      console.error('[Map] Error details:', error.message)
      if (error.message.includes('timeout')) {
        console.error('[Map] 💡 This might indicate network issues or ArcGIS CDN problems')
      }
    }
    throw error
  }
}

// Base marker functions
export async function addBaseMarker(
  mapInstance: MapInstance,
  base: { name: string; lat: number; lng: number },
  color: string = '#3b82f6'
) {
  // ArcGIS implementation only
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
    style: 'square',
    color,
    size: 26,
    outline: {
      color: 'white',
      width: 2,
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

  mapInstance.graphicsLayer.add(graphic)
  mapInstance.markers.push(graphic)

  return graphic
}

// Drone marker functions
export async function addDroneMarker(
  mapInstance: MapInstance,
  drone: { name: string; id?: string },
  position: [number, number],
  color: string = '#10b981',
  shape: 'circle' | 'triangle' | 'square' = 'circle'
) {
  // ArcGIS implementation only
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

  const size = shape === 'triangle' ? 24 : 20

  const symbol = new SimpleMarkerSymbol.default({
    style: shape,
    color,
    size,
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

  mapInstance.graphicsLayer.add(graphic)
  mapInstance.markers.push(graphic)

  return graphic
}

const LOOP_ANIMATION_INTERVAL_MS = 150
const LOOP_PROGRESS_INCREMENT = 0.021 // 30% slower than previous 0.03 step
const SHUTTLE_ANIMATION_INTERVAL_MS = 150
const SHUTTLE_PROGRESS_INCREMENT = LOOP_PROGRESS_INCREMENT

// Path drawing functions
export async function addPathToMap(
  mapInstance: MapInstance,
  path: [number, number][],
  color: string = '#8b5cf6'
) {
  if (!mapInstance) return null

  await clearPath(mapInstance)

  if (!path || path.length === 0) {
    return null
  }

  if (path.length === 1) {
    // Nothing to draw yet with a single waypoint
    return null
  }

  const [
    Polyline,
    Graphic,
    SimpleLineSymbol,
    Point,
    SimpleMarkerSymbol,
  ] = await Promise.all([
    import('@arcgis/core/geometry/Polyline'),
    import('@arcgis/core/Graphic'),
    import('@arcgis/core/symbols/SimpleLineSymbol'),
    import('@arcgis/core/geometry/Point'),
    import('@arcgis/core/symbols/SimpleMarkerSymbol'),
  ])

  const isLoop = path.length >= 3
  const workingPath = isLoop ? createClosedPath(path) : path
  const polyline = new Polyline.default({
    paths: [workingPath],
    spatialReference: { wkid: 4326 },
  })

  const lineSymbol = new SimpleLineSymbol.default({
    style: isLoop ? 'solid' : 'dash',
    color,
    width: 3,
  })

  const lineGraphic = new Graphic.default({
    geometry: polyline,
    symbol: lineSymbol,
  })

  mapInstance.graphicsLayer.add(lineGraphic)
  mapInstance.pathLayer = lineGraphic

  const directionalColor = color
  const directionalSize = isLoop ? 12 : 16

  if (!Array.isArray(mapInstance.pathMarkers)) {
    mapInstance.pathMarkers = []
  }

  if (typeof window === 'undefined') {
    return lineGraphic
  }

  if (mapInstance.pathAnimationTimer) {
    window.clearInterval(mapInstance.pathAnimationTimer)
    mapInstance.pathAnimationTimer = null
  }

  const animationArtifacts: any[] = []
  const PointCtor = Point.default
  const SimpleMarkerSymbolCtor = SimpleMarkerSymbol.default

  if (!isLoop && path.length === 2) {
    const [start, end] = path
    let progress = 0
    let direction = 1

    const shuttleGraphic = new Graphic.default({
      geometry: new PointCtor({ longitude: start[0], latitude: start[1] }),
      symbol: new SimpleMarkerSymbolCtor({
        style: 'circle',
        color: directionalColor,
        size: directionalSize,
        outline: { color: 'white', width: 1.5 },
      }),
    })

    mapInstance.graphicsLayer.add(shuttleGraphic)
    animationArtifacts.push(shuttleGraphic)

    const interval = window.setInterval(() => {
      progress += SHUTTLE_PROGRESS_INCREMENT * direction
      if (progress >= 1) {
        progress = 1
      }
      if (progress <= 0) {
        progress = 0
      }

      const normalizedProgress = direction === 1 ? progress : 1 - progress
      const point = interpolateSegment(start, end, normalizedProgress)

      shuttleGraphic.geometry = new PointCtor({
        longitude: point[0],
        latitude: point[1],
      })

      if (progress === 1) {
        direction = -1
      } else if (progress === 0) {
        direction = 1
      }
    }, SHUTTLE_ANIMATION_INTERVAL_MS)

    mapInstance.pathAnimationTimer = interval
  } else if (isLoop && workingPath.length >= 4) {
    const loopSegments = computeSegments(workingPath)
    const markerCount = Math.min(4, loopSegments.segments.length)
    if (markerCount > 0) {
      const directionalMarkers: any[] = []

      for (let i = 0; i < markerCount; i++) {
        const graphic = new Graphic.default({
          geometry: new PointCtor({ longitude: workingPath[0][0], latitude: workingPath[0][1] }),
          symbol: new SimpleMarkerSymbolCtor({
            style: 'circle',
            color: directionalColor,
            size: directionalSize,
            outline: { color: 'white', width: 1 },
          }),
        })
        directionalMarkers.push(graphic)
      }

      mapInstance.graphicsLayer.addMany(directionalMarkers)
      animationArtifacts.push(...directionalMarkers)

      let progress = 0
      const interval = window.setInterval(() => {
        progress = (progress + LOOP_PROGRESS_INCREMENT) % 1
        directionalMarkers.forEach((graphic, index) => {
          const phase = (progress + index / markerCount) % 1
          const position = interpolatePath(loopSegments, phase)
          if (!position) return

          graphic.geometry = new PointCtor({
            longitude: position.point[0],
            latitude: position.point[1],
          })
        })
      }, LOOP_ANIMATION_INTERVAL_MS)

      mapInstance.pathAnimationTimer = interval
    }
  }

  mapInstance.pathMarkers.push(...animationArtifacts)

  if (path.length > 0 && polyline.extent) {
    await mapInstance.view.goTo(polyline.extent.expand(1.3))
  }

  return lineGraphic
}

export async function clearPath(mapInstance: MapInstance) {
  if (mapInstance.pathLayer) {
    mapInstance.graphicsLayer.remove(mapInstance.pathLayer)
    mapInstance.pathLayer = null
  }
  if (mapInstance.pathMarkers && mapInstance.pathMarkers.length > 0) {
    mapInstance.pathMarkers.forEach((marker) => {
      try {
        mapInstance.graphicsLayer.remove(marker)
      } catch (error) {
        console.error('[Map] Error removing path marker:', error)
      }
    })
    mapInstance.pathMarkers = []
  }
  if (typeof window !== 'undefined' && mapInstance.pathAnimationTimer !== null) {
    window.clearInterval(mapInstance.pathAnimationTimer)
  }
  mapInstance.pathAnimationTimer = null
}

export function clearMarkers(mapInstance: MapInstance) {
  mapInstance.markers.forEach((marker) => {
    mapInstance.graphicsLayer.remove(marker)
  })
  mapInstance.markers = []
}

export function clearWaypointMarkers(mapInstance: MapInstance) {
  // Filter and remove only waypoint markers (those with name 'waypoint')
  const waypointMarkers = mapInstance.markers.filter(
    (marker: any) => marker.attributes?.name === 'waypoint'
  )
  waypointMarkers.forEach((marker: any) => {
    mapInstance.graphicsLayer.remove(marker)
  })
  // Remove waypoint markers from the markers array
  mapInstance.markers = mapInstance.markers.filter(
    (marker: any) => marker.attributes?.name !== 'waypoint'
  )
}

export async function updateDronePosition(
  mapInstance: MapInstance,
  marker: any,
  position: [number, number]
) {
  const Point = (await import('@arcgis/core/geometry/Point')).default
  marker.geometry = new Point({
    longitude: position[0],
    latitude: position[1],
  })
}

type SegmentData = {
  start: [number, number]
  end: [number, number]
  length: number
  cumulativeStart: number
}

type SegmentCollection = {
  segments: SegmentData[]
  totalLength: number
}

const EARTH_RADIUS = 6378137

function projectCoordinate([lng, lat]: [number, number]) {
  const radLat = (lat * Math.PI) / 180
  const radLng = (lng * Math.PI) / 180
  const x = EARTH_RADIUS * radLng
  const y = EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + radLat / 2))
  return { x, y }
}

function interpolateSegment(
  start: [number, number],
  end: [number, number],
  fraction: number
): [number, number] {
  const clamped = Math.max(0, Math.min(1, fraction))
  return [
    start[0] + (end[0] - start[0]) * clamped,
    start[1] + (end[1] - start[1]) * clamped,
  ]
}

function computeBearing(
  start: [number, number],
  end: [number, number]
): number {
  const startProj = projectCoordinate(start)
  const endProj = projectCoordinate(end)
  const angle = Math.atan2(endProj.y - startProj.y, endProj.x - startProj.x)
  const bearing = (angle * 180) / Math.PI
  return (bearing + 360) % 360
}

function createClosedPath(path: [number, number][]): [number, number][] {
  if (path.length < 3) return path
  const first = path[0]
  const last = path[path.length - 1]
  if (first[0] === last[0] && first[1] === last[1]) {
    return path
  }
  return [...path, first]
}

function computeSegments(path: [number, number][]): SegmentCollection {
  const segments: SegmentData[] = []
  let cumulative = 0
  for (let i = 0; i < path.length - 1; i++) {
    const start = path[i]
    const end = path[i + 1]
    const startProj = projectCoordinate(start)
    const endProj = projectCoordinate(end)
    const length = Math.hypot(endProj.x - startProj.x, endProj.y - startProj.y)
    segments.push({
      start,
      end,
      length,
      cumulativeStart: cumulative,
    })
    cumulative += length
  }
  return {
    segments,
    totalLength: cumulative,
  }
}

function interpolatePath(
  segmentCollection: SegmentCollection,
  fraction: number
): { point: [number, number]; bearing: number } | null {
  if (segmentCollection.totalLength === 0) {
    return null
  }
  const target = segmentCollection.totalLength * fraction
  const segments = segmentCollection.segments
  let segment = segments[segments.length - 1]
  for (const candidate of segments) {
    if (candidate.cumulativeStart + candidate.length >= target) {
      segment = candidate
      break
    }
  }
  if (!segment || segment.length === 0) {
    return null
  }
  const distanceAlongSegment = target - segment.cumulativeStart
  const segmentFraction = distanceAlongSegment / segment.length
  const point = interpolateSegment(segment.start, segment.end, segmentFraction)
  const bearing = computeBearing(segment.start, segment.end)
  return { point, bearing }
}

// Export helpers for testing
export const __testables = {
  createClosedPath,
  computeSegments,
  interpolatePath,
  computeBearing,
  interpolateSegment,
  LOOP_PROGRESS_INCREMENT,
  SHUTTLE_PROGRESS_INCREMENT,
}
