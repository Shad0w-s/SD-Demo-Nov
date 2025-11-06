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

  mapInstance.graphicsLayer.add(graphic)
  mapInstance.markers.push(graphic)

  return graphic
}

// Drone marker functions
export async function addDroneMarker(
  mapInstance: MapInstance,
  drone: { name: string; id?: string },
  position: [number, number],
  color: string = '#10b981'
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

  mapInstance.graphicsLayer.add(graphic)
  mapInstance.markers.push(graphic)

  return graphic
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

  // ArcGIS implementation only
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

  mapInstance.graphicsLayer.add(graphic)
  mapInstance.pathLayer = graphic

  // Fit view to path
  if (path.length > 0 && polyline.extent) {
    await mapInstance.view.goTo(polyline.extent.expand(1.5))
  }

  return graphic
}

export async function clearPath(mapInstance: MapInstance) {
  if (mapInstance.pathLayer) {
    mapInstance.graphicsLayer.remove(mapInstance.pathLayer)
    mapInstance.pathLayer = null
  }
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
