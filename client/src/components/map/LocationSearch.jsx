import { useState, useEffect, useRef } from 'react'
import { FaMapMarkerAlt, FaSearch, FaTimes, FaSpinner } from 'react-icons/fa'

// Popular preset Indian cities to guarantee immediate fallback responses offline or on failure
const PRESET_CITIES = [
  { name: 'Delhi', address: 'Connaught Place, New Delhi, Delhi', city: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { name: 'Mumbai', address: 'Gateway of India, Colaba, Mumbai, Maharashtra', city: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Bangalore', address: 'MG Road, Bengaluru, Karnataka', city: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { name: 'Pune', address: 'Shaniwar Wada, Pune, Maharashtra', city: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Hyderabad', address: 'Charminar, Hyderabad, Telangana', city: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { name: 'Chennai', address: 'Marina Beach, Chennai, Tamil Nadu', city: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', address: 'Victoria Memorial, Kolkata, West Bengal', city: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Gurgaon', address: 'Cyber City, Gurgaon, Haryana', city: 'Gurgaon', lat: 28.4595, lng: 77.0266 },
  { name: 'Noida', address: 'Sector 18, Noida, Uttar Pradesh', city: 'Noida', lat: 28.5355, lng: 77.3910 },
  { name: 'Jaipur', address: 'Hawa Mahal, Jaipur, Rajasthan', city: 'Jaipur', lat: 26.9124, lng: 75.7873 }
]

const LocationSearch = ({
  label,
  placeholder,
  value = '',
  onChange,
  onSelectLocation,
  className = ''
}) => {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const hasSelectedRef = useRef(false)

  // Sync with value prop changes (e.g. from geolocation/map clicks)
  useEffect(() => {
    setQuery(value)
    if (value) {
      hasSelectedRef.current = true
    }
  }, [value])

  // Handle click outside to close suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search logic
  useEffect(() => {
    if (!query || query.length < 2 || query === value) {
      setSuggestions([])
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true)
      try {
        // 1. Try Google Autocomplete if script is loaded
        if (window.google && window.google.maps && window.google.maps.places) {
          const autocompleteService = new window.google.maps.places.AutocompleteService()
          autocompleteService.getPlacePredictions(
            { input: query, componentRestrictions: { country: 'in' } },
            async (predictions, status) => {
              if (status === 'OK' && predictions) {
                const results = await Promise.all(
                  predictions.map(async (p) => {
                    // Fetch lat/lng details using PlacesService
                    return {
                      name: p.structured_formatting.main_text,
                      address: p.description,
                      city: p.structured_formatting.secondary_text || '',
                      placeId: p.place_id
                    }
                  })
                )
                setSuggestions(results)
              } else {
                searchOSMNominatim(query)
              }
              setLoading(false)
            }
          )
        } else {
          // 2. Fallback to OSM Nominatim API or preset cities
          await searchOSMNominatim(query)
        }
      } catch (err) {
        console.warn('Autocomplete error, using local filter:', err)
        filterLocalPresets(query)
      }
    }, 450)

    return () => clearTimeout(delayDebounceFn)
  }, [query, value])

  const searchOSMNominatim = async (searchQuery) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
          searchQuery
        )}&countrycodes=in&limit=5`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'EcoRide-App-Phase2'
          }
        }
      )
      if (response.ok) {
        const data = await response.json()
        const results = data.map((item) => {
          const name = item.display_name.split(',')[0]
          const city = item.address?.city || item.address?.town || item.address?.state || ''
          return {
            name,
            address: item.display_name,
            city,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
          }
        })
        setSuggestions(results)
      } else {
        filterLocalPresets(searchQuery)
      }
    } catch (err) {
      filterLocalPresets(searchQuery)
    } finally {
      setLoading(false)
    }
  }

  const filterLocalPresets = (searchQuery) => {
    const q = searchQuery.toLowerCase()
    const filtered = PRESET_CITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q)
    )
    setSuggestions(filtered)
    setLoading(false)
  }

  // Handle select suggestion
  const handleSelect = async (item) => {
    hasSelectedRef.current = true
    setQuery(item.address)
    onChange && onChange(item.address)
    setShowDropdown(false)

    if (item.placeId && window.google) {
      // Fetch details from Google Places
      const mapDiv = document.createElement('div')
      const service = new window.google.maps.places.PlacesService(mapDiv)
      service.getDetails({ placeId: item.placeId }, async (place, status) => {
        if (status === 'OK' && place.geometry) {
          onSelectLocation({
            address: item.address,
            city: item.city || item.name,
            coordinates: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            }
          })
        } else {
          // Google details failed or restricted, fallback to OSM geocoding
          try {
            const queryClean = item.address.split(',')[0];
            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryClean)}&format=json&limit=1`, {
              headers: { 'User-Agent': 'EcoRide-App' }
            });
            if (res.ok) {
              const data = await res.json();
              if (data && data[0]) {
                onSelectLocation({
                  address: item.address,
                  city: item.city || item.name,
                  coordinates: {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon)
                  }
                });
                return;
              }
            }
          } catch (err) {
            console.error('OSM Details fallback search failed:', err);
          }
          // Ultimate local preset fallback
          const cleanPresetName = (item.city || item.name || '').trim().toLowerCase();
          const LOCAL_PRESETS = {
            'prayagraj': { lat: 25.4372, lng: 81.8463 },
            'allahabad': { lat: 25.4372, lng: 81.8463 },
            'lucknow': { lat: 26.8467, lng: 80.9462 },
            'lalgopalganj': { lat: 25.7533, lng: 81.6367 },
            'kunda': { lat: 25.7208, lng: 81.5167 },
            'delhi': { lat: 28.6139, lng: 77.2090 },
            'jaipur': { lat: 26.9124, lng: 75.7873 },
            'kanpur': { lat: 26.4499, lng: 80.3319 }
          };
          const foundPreset = Object.keys(LOCAL_PRESETS).find(k => cleanPresetName.includes(k));
          if (foundPreset) {
            onSelectLocation({
              address: item.address,
              city: item.city || item.name,
              coordinates: LOCAL_PRESETS[foundPreset]
            });
          }
        }
      })
    } else {
      // Use Leaflet/OSM coordinates already present
      onSelectLocation({
        address: item.address,
        city: item.city || item.name,
        coordinates: {
          lat: item.lat,
          lng: item.lng
        }
      })
    }
  }

  const handleBlur = () => {
    setTimeout(async () => {
      if (query && query.length >= 3 && !hasSelectedRef.current) {
        setLoading(true)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}&countrycodes=in&limit=1`,
            {
              headers: {
                'Accept-Language': 'en',
                'User-Agent': 'EcoRide-App-Phase2'
              }
            }
          )
          if (response.ok) {
            const data = await response.json()
            if (data && data[0]) {
              const item = data[0]
              const name = item.display_name.split(',')[0].trim()
              const city = item.address?.city || item.address?.town || item.address?.state || name
              hasSelectedRef.current = true
              onSelectLocation({
                address: item.display_name,
                city: city,
                coordinates: {
                  lat: parseFloat(item.lat),
                  lng: parseFloat(item.lon)
                }
              })
              setQuery(item.display_name)
              setLoading(false)
              return
            }
          }
        } catch (err) {
          console.warn('Auto-geocoding on blur failed:', err)
        }

        // Preset database fallback
        const cleanPresetName = query.trim().toLowerCase()
        const LOCAL_PRESETS = {
          'prayagraj': { lat: 25.4372, lng: 81.8463 },
          'allahabad': { lat: 25.4372, lng: 81.8463 },
          'lucknow': { lat: 26.8467, lng: 80.9462 },
          'lalgopalganj': { lat: 25.7533, lng: 81.6367 },
          'kunda': { lat: 25.7208, lng: 81.5167 },
          'delhi': { lat: 28.6139, lng: 77.2090 },
          'jaipur': { lat: 26.9124, lng: 75.7873 },
          'kanpur': { lat: 26.4499, lng: 80.3319 }
        }
        const foundPreset = Object.keys(LOCAL_PRESETS).find(k => cleanPresetName.includes(k))
        if (foundPreset) {
          hasSelectedRef.current = true
          onSelectLocation({
            address: query,
            city: query,
            coordinates: LOCAL_PRESETS[foundPreset]
          })
        }
        setLoading(false)
      }
    }, 250)
  }

  const handleClear = () => {
    setQuery('')
    onChange && onChange('')
    setSuggestions([])
    setShowDropdown(false)
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
        
        <input
          type="text"
          value={query}
          onChange={(e) => {
            const val = e.target.value
            setQuery(val)
            onChange && onChange(val)
            hasSelectedRef.current = false
            setShowDropdown(true)
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="input-field pl-11 pr-10 bg-dark-950/80 text-sm w-full"
        />

        {loading && (
          <FaSpinner className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-400 text-xs animate-spin" />
        )}

        {!loading && query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors cursor-pointer"
          >
            <FaTimes className="text-xs" />
          </button>
        )}
      </div>

      {/* Suggestion Dropdown */}
      {showDropdown && (suggestions.length > 0 || loading) && (
        <div className="absolute left-0 right-0 mt-2 bg-dark-900/95 backdrop-blur-xl border border-white/5 rounded-xl shadow-2xl z-50 p-2 glass-dark max-h-60 overflow-y-auto">
          {loading && suggestions.length === 0 ? (
            <div className="p-3 text-center text-xs text-gray-500">Searching...</div>
          ) : (
            suggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-white/5 rounded-lg text-gray-300 hover:text-white transition-colors flex items-start gap-3 cursor-pointer"
              >
                <FaMapMarkerAlt className="text-primary-400 text-xs mt-1 flex-shrink-0" />
                <div className="leading-tight">
                  <p className="text-xs font-bold">{item.name}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 truncate max-w-[280px] sm:max-w-md">
                    {item.address}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default LocationSearch
