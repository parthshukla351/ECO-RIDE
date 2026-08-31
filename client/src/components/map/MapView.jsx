import { useState, useEffect, useCallback, useRef } from 'react'
import { FaMapMarkerAlt, FaRoute, FaExpandAlt, FaCompress, FaLocationArrow } from 'react-icons/fa'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'


const MapView = ({ 
  origin,
  destination,
  currentLocation,
  height = '400px',
  showRoute = true,
  interactive = true,
  markers = [],
  onMapClick,
  onRouteCalculated, // Callback: ({ distance, duration })
  routeCoordinates,
  trafficDelaySeconds = 0
}) => {
  const mapContainerRef = useRef(null)
  const [useGoogleMaps, setUseGoogleMaps] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [error, setError] = useState(null)

  // Leaflet references
  const leafletMapRef = useRef(null)
  const leafletMarkersRef = useRef([])
  const leafletRouteRef = useRef(null)

  // Google Maps references
  const googleMapRef = useRef(null)
  const googleMarkersRef = useRef([])
  const googleRouteRendererRef = useRef(null)

  // 1. Detect if a valid Google Maps API Key is available
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY
    const useGoogle = import.meta.env.VITE_USE_GOOGLE_MAPS === 'true'
    if (useGoogle && apiKey && apiKey !== 'your_google_maps_api_key' && apiKey.trim() !== '') {
      setUseGoogleMaps(true)
      loadGoogleMapsScript(apiKey)
    } else {
      setUseGoogleMaps(false)
      initLeafletMap()
    }

    return () => {
      // Cleanup Leaflet Map
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
  }, [])
  // 2. Load Google Maps Script
  const loadGoogleMapsScript = (apiKey) => {
    if (window.google && window.google.maps) {
      initGoogleMap()
      return
    }

    // Prevent duplicate script loading if another MapView is loading it at the same time
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => initGoogleMap())
      existingScript.addEventListener('error', () => {
        setUseGoogleMaps(false)
        initLeafletMap()
      })
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => initGoogleMap()
    script.onerror = () => {
      console.warn('Google Maps failed to load. Falling back to Leaflet.')
      setUseGoogleMaps(false)
      initLeafletMap()
    }
    document.head.appendChild(script)
  }

  // 3. Initialize Leaflet Map (Fallback / Default)
  const initLeafletMap = () => {
    if (!mapContainerRef.current || leafletMapRef.current) return

    const defaultCenter = [20.5937, 78.9629] // India Center
    const zoom = origin?.coordinates ? 12 : 5
    const center = origin?.coordinates 
      ? [origin.coordinates.lat, origin.coordinates.lng] 
      : defaultCenter

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: interactive,
      dragging: interactive,
      doubleClickZoom: interactive,
      scrollWheelZoom: interactive,
      attributionControl: false
    })
    // Standard OpenStreetMap tiles - completely free and no API watermark
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map)

    leafletMapRef.current = map
    setMapLoaded(true)

    // Handle map clicks
    if (onMapClick && interactive) {
      map.on('click', (e) => {
        onMapClick({
          lat: e.latlng.lat,
          lng: e.latlng.lng
        })
      })
    }

    updateLeafletFeatures()
  }

  // 4. Update Leaflet Markers and Routes
  const updateLeafletFeatures = useCallback(() => {
    const map = leafletMapRef.current
    if (!map) return

    // Clear existing markers
    leafletMarkersRef.current.forEach(m => map.removeLayer(m))
    leafletMarkersRef.current = []

    if (leafletRouteRef.current) {
      map.removeLayer(leafletRouteRef.current)
      leafletRouteRef.current = null
    }

    const bounds = L.latLngBounds()

    // Add Origin Marker
    if (origin?.coordinates) {
      const originLatLng = [origin.coordinates.lat, origin.coordinates.lng]
      const originMarker = L.circleMarker(originLatLng, {
        radius: 8,
        fillColor: '#10b981', // green
        fillOpacity: 1,
        color: '#ffffff',
        weight: 2
      }).addTo(map).bindPopup(origin.address || 'Origin')

      leafletMarkersRef.current.push(originMarker)
      bounds.extend(originLatLng)
    }

    // Add Destination Marker
    if (destination?.coordinates) {
      const destLatLng = [destination.coordinates.lat, destination.coordinates.lng]
      const destMarker = L.circleMarker(destLatLng, {
        radius: 8,
        fillColor: '#ef4444', // red
        fillOpacity: 1,
        color: '#ffffff',
        weight: 2
      }).addTo(map).bindPopup(destination.address || 'Destination')

      leafletMarkersRef.current.push(destMarker)
      bounds.extend(destLatLng)
    }

    // Add Live User Location Marker
    if (currentLocation) {
      const currentLatLng = [currentLocation.lat, currentLocation.lng]
      
      // Pulse background circle
      const pulseCircle = L.circle(currentLatLng, {
        radius: 300,
        fillColor: '#10b981',
        fillOpacity: 0.15,
        color: '#10b981',
        opacity: 0.3,
        weight: 1
      }).addTo(map)
      leafletMarkersRef.current.push(pulseCircle)

      // Primary core location dot
      const locationMarker = L.circleMarker(currentLatLng, {
        radius: 6,
        fillColor: '#3b82f6', // blue user location
        fillOpacity: 1,
        color: '#ffffff',
        weight: 2
      }).addTo(map)

      leafletMarkersRef.current.push(locationMarker)
      bounds.extend(currentLatLng)
    }

    // Add Custom Markers
    markers.forEach(m => {
      if (m.coordinates) {
        const marker = L.circleMarker([m.coordinates.lat, m.coordinates.lng], {
          radius: 7,
          fillColor: m.color === 'green' ? '#10b981' : m.color === 'red' ? '#ef4444' : '#3b82f6',
          fillOpacity: 1,
          color: '#ffffff',
          weight: 2
        }).addTo(map).bindPopup(m.label || '')
        leafletMarkersRef.current.push(marker)
      }
    })
    // Draw routing
    if (showRoute) {
      const routeColor = trafficDelaySeconds >= 600 ? '#ef4444' : trafficDelaySeconds >= 180 ? '#f59e0b' : '#10b981';
      if (routeCoordinates && routeCoordinates.length > 0) {
        const polylineCoordinates = routeCoordinates.map(coord => [coord.lat, coord.lng])
        const polyline = L.polyline(polylineCoordinates, {
          color: routeColor,
          weight: 4,
          opacity: 0.8
        }).addTo(map)

        leafletRouteRef.current = polyline
        map.fitBounds(polyline.getBounds(), { padding: [40, 40] })
      } else if (origin?.coordinates && destination?.coordinates) {
        const o = origin.coordinates
        const d = destination.coordinates

        fetch(`https://router.project-osrm.org/route/v1/driving/${o.lng},${o.lat};${d.lng},${d.lat}?overview=full&geometries=geojson`)
          .then(res => res.json())
          .then(data => {
            if (data.routes && data.routes.length > 0) {
              const route = data.routes[0]
              const polylineCoordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]])
              
              const polyline = L.polyline(polylineCoordinates, {
                color: routeColor,
                weight: 4,
                opacity: 0.8
              }).addTo(map)

              leafletRouteRef.current = polyline
              
              // Adjust bounds to show entire route
              map.fitBounds(polyline.getBounds(), { padding: [40, 40] })

              const encodeVal = (val) => {
                val = val < 0 ? ~(val << 1) : val << 1;
                let resStr = '';
                while (val >= 0x20) {
                  resStr += String.fromCharCode((0x20 | (val & 0x1f)) + 63);
                  val >>= 5;
                }
                resStr += String.fromCharCode(val + 63);
                return resStr;
              };

              const encodePolylineCoords = (coordsList) => {
                let resStr = '';
                let prevLat = 0, prevLng = 0;
                for (let coord of coordsList) {
                  const lat = Math.round(coord[0] * 1e5);
                  const lng = Math.round(coord[1] * 1e5);
                  resStr += encodeVal(lat - prevLat) + encodeVal(lng - prevLng);
                  prevLat = lat;
                  prevLng = lng;
                }
                return resStr;
              };

              const encoded = encodePolylineCoords(polylineCoordinates);

              if (onRouteCalculated) {
                onRouteCalculated({
                  distance: (route.distance / 1000).toFixed(1), // in km
                  duration: Math.round(route.duration / 60), // in minutes
                  routePolyline: encoded
                })
              }
            }
          })
          .catch(err => {
            console.error('OSRM Routing failed, drawing straight line:', err)
            const polyline = L.polyline([
              [o.lat, o.lng],
              [d.lat, d.lng]
            ], {
              color: '#10b981',
              weight: 3,
              dashArray: '5, 5',
              opacity: 0.8
            }).addTo(map)
            leafletRouteRef.current = polyline
          })
      }
    } else if (leafletMarkersRef.current.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
    }
  }, [origin, destination, currentLocation, markers, showRoute, onRouteCalculated, routeCoordinates])

  // 5. Initialize Google Map
  const initGoogleMap = () => {
    if (!mapContainerRef.current || googleMapRef.current) return

    const defaultCenter = { lat: 20.5937, lng: 78.9629 }
    const center = origin?.coordinates
      ? { lat: origin.coordinates.lat, lng: origin.coordinates.lng }
      : defaultCenter

    const map = new window.google.maps.Map(mapContainerRef.current, {
      zoom: origin ? 12 : 5,
      center,
      styles: darkMapStyle,
      disableDefaultUI: !interactive,
      zoomControl: interactive,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    })

    googleMapRef.current = map
    setMapLoaded(true)

    if (onMapClick && interactive) {
      map.addListener('click', (e) => {
        onMapClick({
          lat: e.latLng.lat(),
          lng: e.latLng.lng()
        })
      })
    }

    updateGoogleFeatures()
  }

  // 6. Update Google Markers and Directions
  const updateGoogleFeatures = useCallback(() => {
    const map = googleMapRef.current
    if (!map) return

    // Clear existing markers
    googleMarkersRef.current.forEach(m => m.setMap(null))
    googleMarkersRef.current = []

    if (googleRouteRendererRef.current) {
      googleRouteRendererRef.current.setMap(null)
      googleRouteRendererRef.current = null
    }

    const bounds = new window.google.maps.LatLngBounds()

    // Add Origin Marker
    if (origin?.coordinates) {
      const oCoords = { lat: origin.coordinates.lat, lng: origin.coordinates.lng }
      const marker = new window.google.maps.Marker({
        position: oCoords,
        map,
        title: origin.address || 'Origin',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#10b981',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
          scale: 8
        }
      })
      googleMarkersRef.current.push(marker)
      bounds.extend(oCoords)
    }

    // Add Destination Marker
    if (destination?.coordinates) {
      const dCoords = { lat: destination.coordinates.lat, lng: destination.coordinates.lng }
      const marker = new window.google.maps.Marker({
        position: dCoords,
        map,
        title: destination.address || 'Destination',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
          scale: 8
        }
      })
      googleMarkersRef.current.push(marker)
      bounds.extend(dCoords)
    }

    // Current User Location Marker
    if (currentLocation) {
      const uCoords = { lat: currentLocation.lat, lng: currentLocation.lng }
      const marker = new window.google.maps.Marker({
        position: uCoords,
        map,
        title: 'Current Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
          scale: 7
        }
      })
      googleMarkersRef.current.push(marker)
      bounds.extend(uCoords)

      // Pulse circle
      new window.google.maps.Circle({
        map,
        center: uCoords,
        radius: 200,
        fillColor: '#10b981',
        fillOpacity: 0.1,
        strokeColor: '#10b981',
        strokeOpacity: 0.2,
        strokeWeight: 1
      })
    }
    // Draw directions route
    if (showRoute) {
      const routeColor = trafficDelaySeconds >= 600 ? '#ef4444' : trafficDelaySeconds >= 180 ? '#f59e0b' : '#10b981';
      if (routeCoordinates && routeCoordinates.length > 0) {
        const path = routeCoordinates.map(coord => new window.google.maps.LatLng(coord.lat, coord.lng))
        const polyline = new window.google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: routeColor,
          strokeOpacity: 0.8,
          strokeWeight: 4
        })
        polyline.setMap(map)
        googleRouteRendererRef.current = polyline

        const bounds = new window.google.maps.LatLngBounds()
        path.forEach(latLng => bounds.extend(latLng))
        map.fitBounds(bounds)
      } else if (origin?.coordinates && destination?.coordinates) {
        const directionsService = new window.google.maps.DirectionsService()
        const directionsRenderer = new window.google.maps.DirectionsRenderer({
          map,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: routeColor,
            strokeWeight: 4,
            strokeOpacity: 0.8
          }
        })

        googleRouteRendererRef.current = directionsRenderer

        directionsService.route(
          {
            origin: new window.google.maps.LatLng(origin.coordinates.lat, origin.coordinates.lng),
            destination: new window.google.maps.LatLng(destination.coordinates.lat, destination.coordinates.lng),
            travelMode: window.google.maps.TravelMode.DRIVING
          },
          (response, status) => {
            if (status === 'OK') {
              directionsRenderer.setDirections(response)
              const route = response.routes[0].legs[0]
              const polyline = response.routes[0].overview_polyline
              
              if (onRouteCalculated) {
                onRouteCalculated({
                  distance: (route.distance.value / 1000).toFixed(1),
                  duration: Math.round(route.duration.value / 60),
                  routePolyline: polyline
                })
              }
            }
          }
        )
      }
    } else if (googleMarkersRef.current.length > 0) {
      map.fitBounds(bounds)
    }
  }, [origin, destination, currentLocation, markers, showRoute, onRouteCalculated, routeCoordinates])

  // Hook trigger sync
  useEffect(() => {
    if (mapLoaded) {
      if (useGoogleMaps) {
        updateGoogleFeatures()
      } else {
        updateLeafletFeatures()
      }
    }
  }, [mapLoaded, useGoogleMaps, updateGoogleFeatures, updateLeafletFeatures])

  // Invalidate Leaflet Map Size on load to ensure proper tile rendering
  useEffect(() => {
    if (mapLoaded && !useGoogleMaps && leafletMapRef.current) {
      const timer = setTimeout(() => {
        if (leafletMapRef.current) {
          leafletMapRef.current.invalidateSize();
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [mapLoaded, useGoogleMaps])

  // Center pan to current user coordinates
  const handleLocateMe = () => {
    if (!currentLocation) return
    if (useGoogleMaps && googleMapRef.current) {
      googleMapRef.current.panTo({ lat: currentLocation.lat, lng: currentLocation.lng })
      googleMapRef.current.setZoom(14)
    } else if (leafletMapRef.current) {
      leafletMapRef.current.setView([currentLocation.lat, currentLocation.lng], 14)
    }
  }

  return (
    <div 
      className={`relative rounded-2xl overflow-hidden border border-white/5 shadow-2xl ${fullscreen ? 'fixed inset-0 z-50' : ''}`}
      style={{ height: fullscreen ? '100vh' : height, width: '100%' }}
    >
      {/* Map DOM */}
      <div
        ref={mapContainerRef}
        style={{ height: '100%', width: '100%' }}
        className="bg-dark-950"
      />

      {/* Loading Overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-950/80 backdrop-blur-md">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Loading Map Intel...</p>
          </div>
        </div>
      )}

      {/* Map Control Buttons */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 z-[999]">
        <button
          type="button"
          onClick={() => setFullscreen(!fullscreen)}
          className="w-9 h-9 bg-dark-900/90 hover:bg-dark-800 border border-white/5 rounded-xl flex items-center justify-center text-white transition-all shadow-lg backdrop-blur-sm cursor-pointer"
          title="Fullscreen Map"
        >
          {fullscreen ? <FaCompress className="text-xs" /> : <FaExpandAlt className="text-xs" />}
        </button>

        {currentLocation && (
          <button
            type="button"
            onClick={handleLocateMe}
            className="w-9 h-9 bg-primary-500 hover:bg-primary-600 rounded-xl flex items-center justify-center text-white transition-all shadow-lg shadow-primary-500/20 cursor-pointer animate-pulse"
            title="Recenter Location"
          >
            <FaLocationArrow className="text-xs" />
          </button>
        )}
      </div>

      {/* Footer Banner Info */}
      {origin && destination && (
        <div className="absolute bottom-3 left-3 right-3 bg-dark-900/90 border border-white/5 backdrop-blur-md rounded-xl px-4 py-2.5 flex items-center justify-between z-[999] shadow-lg">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-white truncate max-w-[100px] sm:max-w-[150px]">{origin.city}</span>
            <FaRoute className="text-primary-400 text-xs flex-shrink-0" />
            <span className="text-white truncate max-w-[100px] sm:max-w-[150px]">{destination.city}</span>
          </div>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
            {useGoogleMaps ? 'Google Maps' : 'OSM Fallback'}
          </span>
        </div>
      )}
    </div>
  )
}

// Custom Premium Dark Map Style for Google Maps
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#0b0f19" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b0f19" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#4b5563" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#111827" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#4b5563" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1f2937" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#111827" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#374151" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#111827" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#030712" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4b5563" }] }
]

export default MapView