import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FaSearch, FaFilter, FaLeaf, FaCar, FaStar, 
  FaMapMarkerAlt, FaClock, FaUsers, FaRoute,
  FaBolt, FaShieldAlt, FaTimes
} from 'react-icons/fa'
import GlassCard from '../components/ui/GlassCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import api from '../services/api'
import toast from 'react-hot-toast'
import intelligenceService from '../services/intelligenceService'

// Maps integration imports
import MapView from '../components/map/MapView'
import LocationSearch from '../components/map/LocationSearch'

// Extensive local geocoding presets for fast & reliable lookup
const LOCAL_GEOCODE_DB = {
  'prayagraj': { lat: 25.4372, lng: 81.8463 },
  'allahabad': { lat: 25.4372, lng: 81.8463 },
  'lucknow': { lat: 26.8467, lng: 80.9462 },
  'lalgopalganj': { lat: 25.7533, lng: 81.6367 },
  'kunda': { lat: 25.7208, lng: 81.5167 },
  'delhi': { lat: 28.6139, lng: 77.2090 },
  'new delhi': { lat: 28.6139, lng: 77.2090 },
  'jaipur': { lat: 26.9124, lng: 75.7873 },
  'kanpur': { lat: 26.4499, lng: 80.3319 },
  'unnao': { lat: 26.5393, lng: 80.4878 },
  'gurugram': { lat: 28.4595, lng: 77.0266 },
  'gurgaon': { lat: 28.4595, lng: 77.0266 },
  'noida': { lat: 28.5355, lng: 77.3910 },
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'pune': { lat: 18.5204, lng: 73.8567 },
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'bengaluru': { lat: 12.9716, lng: 77.5946 },
  'hyderabad': { lat: 17.3850, lng: 78.4867 },
  'chennai': { lat: 13.0827, lng: 80.2707 },
  'kolkata': { lat: 22.5726, lng: 88.3639 },
  'varanasi': { lat: 25.3176, lng: 82.9739 },
  'banaras': { lat: 25.3176, lng: 82.9739 },
  'agra': { lat: 27.1767, lng: 78.0081 },
  'mathura': { lat: 27.4924, lng: 77.6737 },
  'chandigarh': { lat: 30.7333, lng: 76.7794 },
  'ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'surat': { lat: 21.1702, lng: 72.8311 },
  'patna': { lat: 25.5941, lng: 85.1376 },
  'bhopal': { lat: 23.2599, lng: 77.4126 },
  'indore': { lat: 22.7196, lng: 75.8577 },
  'ayodhya': { lat: 26.7922, lng: 82.1998 },
  'ghaziabad': { lat: 28.6692, lng: 77.4538 },
  'gorakhpur': { lat: 26.7606, lng: 83.3732 }
}

const geocodeAddressFrontend = async (address) => {
  if (!address) return null
  const clean = address.trim().toLowerCase()
  
  const foundKey = Object.keys(LOCAL_GEOCODE_DB).find(key => clean.includes(key))
  if (foundKey) {
    return LOCAL_GEOCODE_DB[foundKey]
  }

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(address)}&countrycodes=in&limit=1`, {
      headers: { 'User-Agent': 'EcoRide-App-Phase2' }
    })
    if (res.ok) {
      const data = await res.json()
      if (data && data[0]) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      }
    }
  } catch (err) {}

  let hash = 0
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash)
  }
  const lat = 25.0 + (Math.abs(hash % 300) / 100)
  const lng = 75.0 + (Math.abs((hash >> 3) % 500) / 100)
  return { lat, lng }
}

const haversineDist = (c1, c2) => {
  if (!c1 || !c2) return 50
  const toRad = x => (x * Math.PI) / 180
  const R = 6371
  const dLat = toRad(c2.lat - c1.lat)
  const dLng = toRad(c2.lng - c1.lng)
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(c1.lat)) * Math.cos(toRad(c2.lat)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const extractOriginDestFromQuery = (query) => {
  if (!query) return { origin: '', destination: '' }
  const clean = query.trim()
  const match = clean.match(/(?:from\s+)?([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+)/i)
  if (match) {
    const cleanCity = str => str.replace(/^(from|find|rides?|book|go|travel)\s+/i, '')
                               .replace(/\s+(tomorrow|today|morning|afternoon|evening|night|cheap|fast|now|electric|ev)$/i, '')
                               .trim()
    return {
      origin: cleanCity(match[1]),
      destination: cleanCity(match[2])
    }
  }
  const words = clean.split(/\s+/)
  if (words.length >= 2) {
    return { origin: words[0], destination: words[words.length - 1] }
  }
  return { origin: clean, destination: '' }
}

const SearchRide = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const [filters, setFilters] = useState({
    origin: searchParams.get('origin') || '',
    destination: searchParams.get('destination') || '',
    date: searchParams.get('date') || new Date().toISOString().split('T')[0],
    seats: searchParams.get('seats') || '1',
    vehicleType: '',
    maxPrice: '',
    womenOnly: false,
    sortBy: 'departureTime'
  })

  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [activeRide, setActiveRide] = useState(null)

  // Smart NLP states
  const [searchMode, setSearchMode] = useState('standard') // 'standard' or 'smart'
  const [smartQuery, setSmartQuery] = useState('')
  const [searchOriginCoords, setSearchOriginCoords] = useState(null)
  const [searchDestinationCoords, setSearchDestinationCoords] = useState(null)
  const [customQuote, setCustomQuote] = useState(null)
  const [requestingOnDemand, setRequestingOnDemand] = useState(false)

  useEffect(() => {
    const initGeocodeAndSearch = async () => {
      const orig = searchParams.get('origin')
      const dest = searchParams.get('destination')
      if (orig && dest) {
        setLoading(true)
        const oCoords = await geocodeAddressFrontend(orig)
        const dCoords = await geocodeAddressFrontend(dest)
        if (oCoords) setSearchOriginCoords(oCoords)
        if (dCoords) setSearchDestinationCoords(dCoords)
        await searchRides(oCoords, dCoords, orig, dest)
      }
    }

    if (searchParams.get('origin') && searchParams.get('destination')) {
      initGeocodeAndSearch()
    }
  }, [])

  const fetchCustomRouteQuote = async (originCoords, destCoords, originName, destName) => {
    if (!originCoords || !destCoords) return null
    
    let distanceKm = 0
    let durationMins = 0
    let polylineCoords = [originCoords, destCoords]
    let encoded = ''

    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}?overview=full&geometries=geojson`)
      if (res.ok) {
        const data = await res.json()
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0]
          distanceKm = parseFloat((route.distance / 1000).toFixed(1))
          durationMins = Math.round(route.duration / 60)
          polylineCoords = route.geometry.coordinates.map(c => ({ lat: c[1], lng: c[0] }))
        }
      }
    } catch (err) {
      console.warn('OSRM router fetch failed, estimating distance:', err)
    }

    if (!distanceKm || distanceKm <= 0) {
      const straightDist = haversineDist(originCoords, destCoords)
      distanceKm = parseFloat((straightDist * 1.25).toFixed(1))
      durationMins = Math.max(10, Math.round((distanceKm / 50) * 60))
      polylineCoords = [originCoords, destCoords]
    }

    const encodeVal = (val) => {
      val = val < 0 ? ~(val << 1) : val << 1
      let resStr = ''
      while (val >= 0x20) {
        resStr += String.fromCharCode((0x20 | (val & 0x1f)) + 63)
        val >>= 5
      }
      resStr += String.fromCharCode(val + 63)
      return resStr
    }

    let prevLat = 0, prevLng = 0
    for (let coord of polylineCoords) {
      const lat = Math.round(coord.lat * 1e5)
      const lng = Math.round(coord.lng * 1e5)
      encoded += encodeVal(lat - prevLat) + encodeVal(lng - prevLng)
      prevLat = lat
      prevLng = lng
    }

    const baseRatePerKm = 12
    const baseFare = Math.max(50, Math.round(distanceKm * baseRatePerKm))
    const platformFee = 15
    const gst = Math.round((baseFare + platformFee) * 0.05)
    const estimatedTotal = baseFare + platformFee + gst

    const quoteObj = {
      origin: {
        address: originName || 'Pickup Location',
        city: (originName || 'Pickup').split(',')[0].trim(),
        coordinates: originCoords
      },
      destination: {
        address: destName || 'Destination Location',
        city: (destName || 'Destination').split(',')[0].trim(),
        coordinates: destCoords
      },
      distance: distanceKm,
      duration: durationMins,
      routePolyline: encoded,
      routeCoordinates: polylineCoords,
      baseRatePerKm,
      baseFare,
      platformFee,
      gst,
      estimatedTotal
    }

    setCustomQuote(quoteObj)
    return quoteObj
  }

  const searchRides = async (overrideOriginCoords = null, overrideDestCoords = null, forceOrigin = null, forceDest = null) => {
    setLoading(true)
    setHasSearched(true)
    setCustomQuote(null)
    try {
      let results = []
      let originName = forceOrigin || filters.origin
      let destName = forceDest || filters.destination
      let activeOriginCoords = overrideOriginCoords || searchOriginCoords
      let activeDestCoords = overrideDestCoords || searchDestinationCoords

      if (searchMode === 'smart') {
        const extracted = extractOriginDestFromQuery(smartQuery)
        if (extracted.origin) originName = extracted.origin
        if (extracted.destination) destName = extracted.destination

        try {
          const data = await intelligenceService.smartSearch(smartQuery)
          results = data.rides || []
          if (data.parsedParams) {
            if (data.parsedParams.origin) originName = data.parsedParams.origin
            if (data.parsedParams.destination) destName = data.parsedParams.destination
            setFilters(prev => ({
              ...prev,
              origin: data.parsedParams.origin || originName,
              destination: data.parsedParams.destination || destName,
              date: data.parsedParams.date || prev.date,
              vehicleType: data.parsedParams.vehicleType || prev.vehicleType,
              womenOnly: data.parsedParams.womenOnly || prev.womenOnly
            }))
          }
        } catch (err) {
          console.warn('Backend smartSearch failed, proceeding with local extraction:', err)
        }
      }

      if (!activeOriginCoords && originName) {
        activeOriginCoords = await geocodeAddressFrontend(originName)
        setSearchOriginCoords(activeOriginCoords)
      }
      if (!activeDestCoords && destName) {
        activeDestCoords = await geocodeAddressFrontend(destName)
        setSearchDestinationCoords(activeDestCoords)
      }

      if (searchMode === 'standard') {
        const params = new URLSearchParams()
        Object.keys(filters).forEach(key => {
          if (filters[key] !== undefined && filters[key] !== '') params.append(key, filters[key])
        })
        if (activeOriginCoords) {
          params.append('originLat', activeOriginCoords.lat)
          params.append('originLng', activeOriginCoords.lng)
        }
        if (activeDestCoords) {
          params.append('destinationLat', activeDestCoords.lat)
          params.append('destinationLng', activeDestCoords.lng)
        }
        try {
          const { data } = await api.get(`/rides/search?${params.toString()}`)
          results = data.rides || []
        } catch (err) {
          console.warn('Standard search endpoint error:', err)
        }
      }

      setRides(results)

      if (activeOriginCoords && activeDestCoords && (originName || destName)) {
        await fetchCustomRouteQuote(activeOriginCoords, activeDestCoords, originName, destName)
      }

      if (results.length === 0) {
        toast('Direct route quote generated!', { icon: '🌱' })
      } else {
        setActiveRide(results[0])
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Search encountered an error. Calculating direct route...')
      const originName = filters.origin || smartQuery.split(/\s+to\s+/i)[0] || 'Origin'
      const destName = filters.destination || smartQuery.split(/\s+to\s+/i)[1] || 'Destination'
      const oCoords = await geocodeAddressFrontend(originName)
      const dCoords = await geocodeAddressFrontend(destName)
      if (oCoords && dCoords) {
        await fetchCustomRouteQuote(oCoords, dCoords, originName, destName)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBookOnDemand = async () => {
    if (!customQuote) return
    setRequestingOnDemand(true)
    try {
      const { data } = await api.post('/ondemand/request', {
        origin: customQuote.origin,
        destination: customQuote.destination,
        distance: customQuote.distance,
        duration: customQuote.duration,
        routePolyline: customQuote.routePolyline,
        routeCoordinates: customQuote.routeCoordinates
      })
      if (data.success) {
        toast.success('🚗 Custom ride request broadcasted to nearby drivers!')
        navigate(`/tracking/${data.request._id}`)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create request')
    } finally {
      setRequestingOnDemand(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchMode === 'smart') {
      if (!smartQuery.trim()) {
        toast.error('Please enter a query for the AI search')
        return
      }
    } else {
      if (!filters.origin || !filters.destination) {
        toast.error('Please enter origin and destination')
        return
      }
    }
    searchRides()
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const vehicleIcons = {
    electric: '⚡',
    hybrid: '🔋',
    petrol: '⛽',
    diesel: '🛢️'
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Search Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-black font-display text-white tracking-tight">
          Find Your Eco Ride 🌱
        </h1>
        <p className="text-gray-400 text-sm font-medium mt-1">Book shared transits and accumulate environmental points.</p>
      </motion.div>

      {/* Search Filter Card */}
      <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-6 sm:p-8">
        {/* Search Mode Tabs */}
        <div className="flex border-b border-white/5 pb-3 mb-5 gap-4">
          <button
            type="button"
            onClick={() => setSearchMode('standard')}
            className={`text-xs uppercase font-black tracking-wider pb-1.5 transition-all cursor-pointer border-b-2
              ${searchMode === 'standard' ? 'border-primary-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            📍 Location Search
          </button>
          <button
            type="button"
            onClick={() => setSearchMode('smart')}
            className={`text-xs uppercase font-black tracking-wider pb-1.5 transition-all cursor-pointer border-b-2
              ${searchMode === 'smart' ? 'border-primary-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            ✨ AI Smart Search
          </button>
        </div>

        <form onSubmit={handleSearch} className="space-y-6">
          {searchMode === 'smart' ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Describe Your Trip Intent</label>
                <div className="relative">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                  <input
                    type="text"
                    value={smartQuery}
                    onChange={(e) => setSmartQuery(e.target.value)}
                    placeholder="e.g. Find electric rides from Delhi to Noida tomorrow morning"
                    className="input-field pl-11 bg-dark-950/80 text-sm py-3.5"
                  />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 font-bold leading-normal">
                💡 Tip: Mention cities, dates (tomorrow), times (morning, 8 AM), preferences (women only, cheap), or EV options naturally.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-5 gap-4 items-end">
              {/* Origin */}
              <LocationSearch
                label="From"
                placeholder="Search pickup..."
                value={filters.origin}
                onChange={(val) => {
                  setFilters(prev => ({ ...prev, origin: val }))
                  setSearchOriginCoords(null)
                }}
                onSelectLocation={(loc) => {
                  setFilters(prev => ({ ...prev, origin: loc.city || loc.address }))
                  setSearchOriginCoords({ lat: loc.coordinates?.lat, lng: loc.coordinates?.lng })
                }}
                className="md:col-span-2"
              />

              {/* Destination */}
              <LocationSearch
                label="To"
                placeholder="Search destination..."
                value={filters.destination}
                onChange={(val) => {
                  setFilters(prev => ({ ...prev, destination: val }))
                  setSearchDestinationCoords(null)
                }}
                onSelectLocation={(loc) => {
                  setFilters(prev => ({ ...prev, destination: loc.city || loc.address }))
                  setSearchDestinationCoords({ lat: loc.coordinates?.lat, lng: loc.coordinates?.lng })
                }}
                className="md:col-span-2"
              />

              {/* Date */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Date</label>
                <input
                  type="date"
                  name="date"
                  value={filters.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="input-field bg-dark-950/80 text-sm py-3"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-2">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-24 space-y-1">
                <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400">Seats</label>
                <select
                  name="seats"
                  value={filters.seats}
                  onChange={handleChange}
                  className="input-field bg-dark-950/80 text-xs py-2.5 cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <option key={n} value={n}>{n} seat{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="pt-5">
                <AnimatedButton
                  type="button"
                  variant="secondary"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`text-xs uppercase tracking-wider py-2.5 px-4 ${showFilters ? 'bg-primary-500/10 border-primary-500/20 text-primary-400' : ''}`}
                >
                  <FaFilter className="text-[10px]" /> Advanced Filters
                </AnimatedButton>
              </div>
            </div>

            <AnimatedButton
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full sm:w-48 py-3.5 text-xs font-black uppercase tracking-wider"
            >
              {loading ? 'Searching...' : 'Search Rides 🌱'}
            </AnimatedButton>
          </div>

          {/* Advanced Dropdown */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid md:grid-cols-4 gap-4 pt-6 border-t border-white/5"
            >
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Vehicle Fuel Type</label>
                <select
                  name="vehicleType"
                  value={filters.vehicleType}
                  onChange={handleChange}
                  className="input-field bg-dark-950/80 text-xs cursor-pointer py-2.5"
                >
                  <option value="">All Fuel Types</option>
                  <option value="electric">⚡ Electric</option>
                  <option value="hybrid">🔋 Hybrid</option>
                  <option value="petrol">⛽ Petrol</option>
                  <option value="diesel">🛢️ Diesel</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Max Ticket Price (₹)</label>
                <input
                  type="number"
                  name="maxPrice"
                  value={filters.maxPrice}
                  onChange={handleChange}
                  placeholder="500"
                  className="input-field bg-dark-950/80 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Sort Results By</label>
                <select
                  name="sortBy"
                  value={filters.sortBy}
                  onChange={handleChange}
                  className="input-field bg-dark-950/80 text-xs cursor-pointer py-2.5"
                >
                  <option value="departureTime">Departure Time</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Highest Rated Drivers</option>
                  <option value="eco">Highest Eco Points</option>
                </select>
              </div>

              <div className="flex items-end pb-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="womenOnly"
                    checked={filters.womenOnly}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-white/10 bg-dark-900 text-primary-500 focus:ring-primary-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Women Only Rides</span>
                </label>
              </div>
            </motion.div>
          )}
        </form>
      </GlassCard>

      {/* Ride Results */}
      {loading ? (
        <div className="text-center py-16 space-y-4">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">Searching verified rides...</p>
        </div>

      ) : rides.length === 0 ? (
        <div className="space-y-6">
          {customQuote ? (
            <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-6 space-y-6">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Quote details */}
                <div className="flex-1 space-y-5">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black tracking-wider bg-primary-500/10 border border-primary-500/20 text-primary-400">
                      Direct On-Demand Quote
                    </span>
                    <h3 className="text-xl font-bold text-white font-display mt-2">No Scheduled Rides? Book Direct!</h3>
                    <p className="text-gray-400 text-xs mt-1">We can broadcast your trip to nearby drivers right away.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-gray-500">From</span>
                        <p className="text-white font-semibold text-sm">{customQuote.origin.address}</p>
                      </div>
                      <FaRoute className="text-primary-400 text-xs mt-3 animate-pulse" />
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-gray-500">To</span>
                        <p className="text-white font-semibold text-sm">{customQuote.destination.address}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                    <div>
                      <FaRoute className="text-primary-400 text-lg mx-auto mb-1.5" />
                      <p className="text-white font-black text-lg">{customQuote.distance} km</p>
                      <p className="text-gray-500 text-[10px] font-bold">ROUTE DISTANCE</p>
                    </div>
                    <div>
                      <FaClock className="text-primary-400 text-lg mx-auto mb-1.5" />
                      <p className="text-white font-black text-lg">{customQuote.duration} min</p>
                      <p className="text-gray-500 text-[10px] font-bold">ESTIMATED TIME</p>
                    </div>
                  </div>

                  <div className="space-y-2 py-3 border-t border-b border-white/5 text-xs font-semibold text-gray-400">
                    <div className="flex justify-between">
                      <span>Base Rate (₹12/km):</span>
                      <span className="text-white">₹{customQuote.baseFare}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform Fee:</span>
                      <span className="text-white">+₹{customQuote.platformFee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (5%):</span>
                      <span className="text-white">+₹{customQuote.gst}</span>
                    </div>
                    <div className="border-t border-white/5 my-1.5"></div>
                    <div className="flex justify-between text-gray-300 font-bold">
                      <span>TOTAL EST. FARE:</span>
                      <span className="text-primary-400 font-black text-sm">₹{customQuote.estimatedTotal}</span>
                    </div>
                  </div>

                  <AnimatedButton
                    onClick={handleBookOnDemand}
                    disabled={requestingOnDemand}
                    variant="primary"
                    fullWidth
                    className="py-3.5 text-xs font-black uppercase tracking-wider"
                  >
                    {requestingOnDemand ? 'Requesting...' : 'Request Direct On-Demand Ride 🌱'}
                  </AnimatedButton>
                </div>

                {/* Inline map */}
                <div className="w-full lg:w-[400px] h-[320px] rounded-2xl border border-white/5 overflow-hidden bg-dark-900/20">
                  <MapView
                    origin={customQuote.origin}
                    destination={customQuote.destination}
                    height="100%"
                    showRoute={true}
                    interactive={true}
                    routeCoordinates={customQuote.routeCoordinates}
                  />
                </div>
              </div>
            </GlassCard>
          ) : hasSearched ? (
            <GlassCard hoverable={false} className="text-center py-16 space-y-6 border-white/5 bg-dark-900/40">
              <FaCar className="text-gray-600 text-5xl mx-auto opacity-35" />
              <div>
                <h3 className="text-xl font-bold text-white font-display">No Available Rides Found</h3>
                <p className="text-gray-400 text-sm mt-1">Try relaxing your search parameters or check back later.</p>
              </div>
              <AnimatedButton
                onClick={() => setFilters({
                  ...filters,
                  vehicleType: '',
                  maxPrice: '',
                  womenOnly: false
                })}
                variant="secondary"
                className="text-xs uppercase tracking-wider"
              >
                Reset Filters
              </AnimatedButton>
            </GlassCard>
          ) : (
            <GlassCard hoverable={false} className="text-center py-16 space-y-4 border-white/5 bg-dark-900/40">
              <div className="w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mx-auto text-primary-400 text-2xl">
                🌱
              </div>
              <div>
                <h3 className="text-xl font-bold text-white font-display">Search Any Route Across India</h3>
                <p className="text-gray-400 text-xs mt-1 max-w-md mx-auto">
                  Type any pickup and destination in the search box above. The system calculates distance, maps the route, and provides instant pricing & on-demand booking!
                </p>
              </div>
            </GlassCard>
          )}
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Results List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center px-1 pb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Found <span className="text-white">{rides.length}</span> matching ride{rides.length !== 1 ? 's' : ''}
              </span>
              
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-[10px] uppercase font-bold">Sort By</span>
                <select
                  value={filters.sortBy || 'departureTime'}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilters(prev => ({ ...prev, sortBy: val }));
                    // Automatically trigger search refresh after state update
                    setTimeout(() => {
                      searchRides();
                    }, 50);
                  }}
                  className="bg-dark-950 border border-white/5 text-xs text-white rounded-xl py-1.5 px-3.5 outline-none cursor-pointer font-bold"
                >
                  <option value="best_match">✨ Best Match</option>
                  <option value="departureTime">📅 Date & Time</option>
                  <option value="price_low">₹ Price: Low to High</option>
                  <option value="rating">★ Driver Rating</option>
                  <option value="eco">🍃 Eco Saved</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {rides.map((ride, idx) => (
                <motion.div
                  key={ride._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  onClick={() => {
                    const searchParamsStr = new URLSearchParams({
                      originLat: searchOriginCoords?.lat || '',
                      originLng: searchOriginCoords?.lng || '',
                      destinationLat: searchDestinationCoords?.lat || '',
                      destinationLng: searchDestinationCoords?.lng || '',
                      pickupAddress: filters.origin || '',
                      dropAddress: filters.destination || '',
                      seats: filters.seats || '1'
                    }).toString();
                    navigate(`/ride/${ride._id}?${searchParamsStr}`);
                  }}
                  onMouseEnter={() => setActiveRide(ride)}
                  className="glass-card bg-dark-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl hover:border-primary-500/25 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    {/* Left: Driver profile */}
                    <div className="flex items-center gap-4">
                      <img
                        src={ride.driver?.avatar || 'https://res.cloudinary.com/demo/image/upload/v1/default-avatar.png'}
                        alt={ride.driver?.name}
                        className="w-14 h-14 rounded-full object-cover border border-white/10"
                      />
                      <div>
                        <h4 className="text-white font-bold flex items-center gap-1.5">
                          {ride.driver?.name}
                          <span className="px-1.5 py-0.5 bg-primary-500/10 border border-primary-500/20 text-primary-400 text-[8px] font-black uppercase rounded-full tracking-wider leading-none">
                            {ride.driver?.safetyScore || 75} Trust
                          </span>
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1 font-semibold">
                          <span className="flex items-center gap-0.5 text-yellow-400">
                            ★ {ride.driver?.averageRating?.toFixed(1) || '0.0'}
                          </span>
                          <span>•</span>
                          <span>{ride.driver?.totalRides || 0} rides completed</span>
                        </div>
                        <div className="flex flex-col gap-1.5 mt-1.5">
                          <span className="eco-badge text-[9px] uppercase font-black w-max">
                            {ride.driver?.ecoLevel || 'Seedling'}
                          </span>
                          {ride.matchScore !== undefined && (
                            <div className="flex flex-wrap gap-1.5 items-center">
                              <span className={`px-2 py-0.5 border rounded-full text-[8px] font-black uppercase tracking-wider w-max
                                ${ride.matchScore >= 80 
                                  ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                                  : ride.matchScore >= 50 
                                    ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' 
                                    : 'bg-gray-500/10 border-white/10 text-gray-400'
                                }`}
                              >
                                ✨ {ride.matchScore}% Match
                              </span>
                              {ride.matchType && (
                                <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[8px] font-black uppercase rounded-full tracking-wider w-max">
                                  📍 {ride.matchType.replace('_', ' ')}
                                </span>
                              )}
                              {ride.routeOverlap !== undefined && (
                                <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[8px] font-black uppercase rounded-full tracking-wider w-max">
                                  ⚡ {ride.routeOverlap}% Overlap
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Route & Times */}
                    <div className="flex-1 md:px-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-gray-500">From</span>
                          <p className="text-white font-semibold text-sm">{ride.origin?.city}</p>
                        </div>
                        <FaRoute className="text-primary-400 text-xs mt-3" />
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-gray-500">To</span>
                          <p className="text-white font-semibold text-sm">{ride.destination?.city}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-400">
                        <span className="flex items-center gap-1">
                          <FaClock className="text-primary-400 text-[10px]" />
                          {new Date(ride.departureTime).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaUsers className="text-primary-400 text-[10px]" />
                          {ride.availableSeats} of {ride.totalSeats} seats open
                        </span>
                        <span className="flex items-center gap-1">
                          {vehicleIcons[ride.vehicleType] || '🚗'}
                          <span className="capitalize">{ride.vehicleType}</span>
                        </span>
                        {ride.totalDetour !== undefined && (
                          <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/5 px-2 py-0.5 border border-emerald-500/10 rounded">
                            <FaRoute className="text-[10px]" />
                            Detour: +{ride.totalDetour} km
                          </span>
                        )}
                      </div>

                      {ride.matchType && ride.matchType !== 'EXACT_ROUTE' && (
                        <div className="mt-3 bg-white/5 border border-white/5 p-3 rounded-xl space-y-1.5 text-xs text-gray-300 font-semibold" onClick={(e) => e.stopPropagation()}>
                          <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Matched Shared Route Info</div>
                          <div className="flex justify-between">
                            <span>Driver's Route:</span>
                            <span className="text-white font-bold">{ride.origin?.city} → {ride.destination?.city}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Your Route:</span>
                            <span className="text-white font-bold">{filters.origin || ride.origin?.city} → {filters.destination || ride.destination?.city}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Segment Distance:</span>
                            <span className="text-primary-400 font-bold">{ride.segmentDistance || ride.distance} km</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Available Seats:</span>
                            <span className="text-white font-bold">{ride.availableSeats}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Your Fare:</span>
                            <span className="text-primary-400 font-bold">₹{ride.passengerPricePerSeat || ride.pricePerSeat}</span>
                          </div>
                        </div>
                      )}

                      {/* Preferences Tags */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {ride.preferences?.womenOnly && (
                          <span className="px-2 py-0.5 bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[9px] uppercase font-black tracking-wider rounded-full">
                            Women Only
                          </span>
                        )}
                        {ride.preferences?.acAvailable && (
                          <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] uppercase font-black tracking-wider rounded-full">
                            Climate Control
                          </span>
                        )}
                        {ride.vehicleType === 'electric' && (
                          <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] uppercase font-black tracking-wider rounded-full flex items-center gap-0.5">
                            <FaBolt className="text-[8px] animate-pulse" /> Zero Emissions
                          </span>
                        )}
                      </div>

                      {/* Explainable Match Reasons */}
                      {ride.matchReasons && ride.matchReasons.length > 0 && (
                        <div className="mt-3.5 flex flex-wrap gap-1.5 items-center">
                          {ride.matchReasons.map((reason, rIdx) => (
                            <span key={rIdx} className="px-2 py-0.5 bg-white/5 border border-white/5 text-[9px] text-gray-400 rounded-md font-semibold">
                              ✓ {reason}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right: Pricing & Details trigger */}
                    <div className="flex md:flex-col justify-between items-end gap-2 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                      <div className="text-left md:text-right">
                        <span className="text-[9px] uppercase tracking-wider text-gray-500">
                          {ride.matchType && ride.matchType !== 'EXACT_ROUTE' ? 'Your Segment Price' : 'Seat Price'}
                        </span>
                        <p className="text-2xl font-black text-primary-400 font-display">
                          ₹{ride.passengerPricePerSeat || ride.pricePerSeat}
                        </p>
                        {ride.matchType && ride.matchType !== 'EXACT_ROUTE' && (
                          <span className="text-[9px] font-bold text-gray-500 block">
                            (Full Route: ₹{ride.pricePerSeat})
                          </span>
                        )}
                      </div>

                      <div className="text-right flex items-center md:flex-col gap-3">
                        <div className="eco-badge">
                          <FaLeaf className="text-[10px]" />
                          {ride.carbonSaved?.toFixed(2)} kg CO₂
                        </div>
                        <AnimatedButton variant="primary" className="py-2 px-3 text-[10px] uppercase font-black tracking-wider">
                          View Details
                        </AnimatedButton>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1 hidden lg:block sticky top-24 h-[550px] w-full">
            <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-4 h-full flex flex-col gap-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FaRoute className="text-primary-400" /> Selected Route Map
              </h4>
              <div className="flex-1 w-full relative rounded-xl overflow-hidden">
                <MapView
                  origin={activeRide?.origin || rides[0]?.origin}
                  destination={activeRide?.destination || rides[0]?.destination}
                  height="100%"
                  showRoute={true}
                  interactive={true}
                  routeCoordinates={activeRide?.routeCoordinates || rides[0]?.routeCoordinates}
                  markers={[
                    ...(searchOriginCoords ? [{ coordinates: searchOriginCoords, label: 'Your Pickup', color: 'green' }] : []),
                    ...(searchDestinationCoords ? [{ coordinates: searchDestinationCoords, label: 'Your Dropoff', color: 'red' }] : [])
                  ]}
                />              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchRide
