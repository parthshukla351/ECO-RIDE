import { useState, useEffect, useCallback, useRef } from 'react'
import { FaMapMarkerAlt, FaRoute, FaExpandAlt, FaCompress } from 'react-icons/fa'

const MapView = ({ 
  origin,
  destination,
  currentLocation,
  height = '400px',
  showRoute = true,
  interactive = true,
  markers = []
}) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [error, setError] = useState(null)

  // Load Google Maps Script
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY
    
    if (!apiKey || apiKey === 'your_google_maps_api_key') {
      setError('Google Maps API key not configured')
      return
    }

    if (window.google && window.google.maps) {
      initMap()
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => initMap()
    script.onerror = () => setError('Failed to load Google Maps')
    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  const initMap = useCallback(() => {
    if (!mapRef.current || !window.google) return

    const defaultCenter = { lat: 20.5937, lng: 78.9629 } // India center
    const center = origin?.coordinates
      ? { lat: origin.coordinates.lat, lng: origin.coordinates.lng }
      : defaultCenter

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: origin ? 8 : 5,
      center,
      styles: darkMapStyle,
      disableDefaultUI: !interactive,
      zoomControl: interactive,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    })

    mapInstanceRef.current = map
    setMapLoaded(true)

    // Add markers
    if (origin?.coordinates) {
      addMarker(map, origin.coordinates, origin.address || 'Origin', 'green')
    }

    if (destination?.coordinates) {
      addMarker(map, destination.coordinates, destination.address || 'Destination', 'red')
    }

    // Add custom markers
    markers.forEach(m => {
      addMarker(map, m.coordinates, m.label, m.color || 'blue')
    })

    // Draw route
    if (showRoute && origin?.coordinates && destination?.coordinates) {
      drawRoute(map, origin.coordinates, destination.coordinates)
    }

    // Current location marker
    if (currentLocation) {
      const currentMarker = new window.google.maps.Marker({
        position: currentLocation,
        map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#10b981',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
          scale: 8
        },
        title: 'Current Location'
      })

      // Add pulsing effect
      const pulseCircle = new window.google.maps.Circle({
        map,
        center: currentLocation,
        radius: 200,
        fillColor: '#10b981',
        fillOpacity: 0.15,
        strokeColor: '#10b981',
        strokeOpacity: 0.3,
        strokeWeight: 1
      })
    }
  }, [origin, destination, currentLocation, markers, showRoute, interactive])

  const addMarker = (map, position, title, color) => {
    const colors = {
      green: '#10b981',
      red: '#ef4444',
      blue: '#3b82f6',
      yellow: '#f59e0b'
    }

    new window.google.maps.Marker({
      position: { lat: position.lat, lng: position.lng },
      map,
      title,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: colors[color] || colors.blue,
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
        scale: 10
      }
    })
  }

  const drawRoute = (map, originCoords, destCoords) => {
    const directionsService = new window.google.maps.DirectionsService()
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#10b981',
        strokeWeight: 4,
        strokeOpacity: 0.8
      }
    })

    directionsService.route(
      {
        origin: new window.google.maps.LatLng(originCoords.lat, originCoords.lng),
        destination: new window.google.maps.LatLng(destCoords.lat, destCoords.lng),
        travelMode: window.google.maps.TravelMode.DRIVING
      },
      (response, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(response)
          
          // Fit bounds
          const bounds = new window.google.maps.LatLngBounds()
          bounds.extend(new window.google.maps.LatLng(originCoords.lat, originCoords.lng))
          bounds.extend(new window.google.maps.LatLng(destCoords.lat, destCoords.lng))
          map.fitBounds(bounds, 50)
        }
      }
    )
  }

  // Update current location marker
  useEffect(() => {
    if (mapInstanceRef.current && currentLocation) {
      mapInstanceRef.current.panTo(currentLocation)
    }
  }, [currentLocation])

  if (error) {
    return (
      <div 
        className="bg-gray-800 rounded-xl border border-gray-700 flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center p-6">
          <FaMapMarkerAlt className="text-gray-600 text-4xl mx-auto mb-3" />
          <p className="text-gray-400 text-sm mb-2">{error}</p>
          <p className="text-gray-500 text-xs">
            Add VITE_GOOGLE_MAPS_KEY to client/.env
          </p>

          {/* Fallback: Show static info */}
          {origin && destination && (
            <div className="mt-4 p-4 bg-gray-900 rounded-lg text-left">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-300 text-sm">{origin.address || origin.city}</span>
              </div>
              <div className="ml-1.5 border-l-2 border-dashed border-gray-600 h-6"></div>
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt className="text-red-500 text-sm" />
                <span className="text-gray-300 text-sm">{destination.address || destination.city}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`relative rounded-xl overflow-hidden border border-gray-700 ${fullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Map */}
      <div
        ref={mapRef}
        style={{ height: fullscreen ? '100vh' : height, width: '100%' }}
        className="bg-gray-800"
      />

      {/* Loading Overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-center">
            <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-400 text-sm">Loading map...</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-2">
        <button
          onClick={() => setFullscreen(!fullscreen)}
          className="w-8 h-8 bg-gray-900/90 hover:bg-gray-800 rounded-lg flex items-center justify-center text-white transition-colors"
        >
          {fullscreen ? <FaCompress className="text-xs" /> : <FaExpandAlt className="text-xs" />}
        </button>
      </div>

      {/* Route Info */}
      {origin && destination && (
        <div className="absolute bottom-3 left-3 right-3 bg-gray-900/90 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-300 truncate max-w-[120px]">{origin.city}</span>
            <FaRoute className="text-primary-400 text-xs" />
            <span className="text-gray-300 truncate max-w-[120px]">{destination.city}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Dark mode map style
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] }
]

export default MapView