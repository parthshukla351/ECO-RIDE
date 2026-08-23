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
  const [showFilters, setShowFilters] = useState(false)
  const [activeRide, setActiveRide] = useState(null)

  // Smart NLP states
  const [searchMode, setSearchMode] = useState('standard') // 'standard' or 'smart'
  const [smartQuery, setSmartQuery] = useState('')
  const [searchOriginCoords, setSearchOriginCoords] = useState(null)
  const [searchDestinationCoords, setSearchDestinationCoords] = useState(null)

  useEffect(() => {
    const initGeocodeAndSearch = async () => {
      const orig = searchParams.get('origin')
      const dest = searchParams.get('destination')
      let oCoords = null
      let dCoords = null

      setLoading(true)
      try {
        if (orig) {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(orig)}&countrycodes=in&limit=1`, {
            headers: { 'User-Agent': 'EcoRide-App-Phase2' }
          })
          if (res.ok) {
            const data = await res.json()
            if (data && data[0]) {
              oCoords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
              setSearchOriginCoords(oCoords)
            }
          }
        }
        if (dest) {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(dest)}&countrycodes=in&limit=1`, {
            headers: { 'User-Agent': 'EcoRide-App-Phase2' }
          })
          if (res.ok) {
            const data = await res.json()
            if (data && data[0]) {
              dCoords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
              setSearchDestinationCoords(dCoords)
            }
          }
        }
      } catch (err) {
        console.warn('Initial search geocoding failed:', err)
      }

      await searchRides(oCoords, dCoords)
    }

    if (filters.origin && filters.destination) {
      initGeocodeAndSearch()
    }
  }, [])

  const searchRides = async (overrideOriginCoords = null, overrideDestCoords = null) => {
    setLoading(true)
    try {
      let results = []

      if (searchMode === 'smart') {
        const data = await intelligenceService.smartSearch(smartQuery)
        results = data.rides

        // Sync parsed parameters to standard form
        if (data.parsedParams) {
          setFilters(prev => ({
            ...prev,
            origin: data.parsedParams.origin || prev.origin,
            destination: data.parsedParams.destination || prev.destination,
            date: data.parsedParams.date || prev.date,
            vehicleType: data.parsedParams.vehicleType || prev.vehicleType,
            womenOnly: data.parsedParams.womenOnly || prev.womenOnly
          }))
        }
      } else {
        let activeOriginCoords = overrideOriginCoords || searchOriginCoords
        let activeDestCoords = overrideDestCoords || searchDestinationCoords

        // Geocode origin on-the-fly if coords are missing
        if (!activeOriginCoords && filters.origin) {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(filters.origin)}&countrycodes=in&limit=1`, {
              headers: { 'User-Agent': 'EcoRide-App-Phase2' }
            })
            if (res.ok) {
              const data = await res.json()
              if (data && data[0]) {
                activeOriginCoords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
                setSearchOriginCoords(activeOriginCoords)
              }
            }
          } catch (err) {
            console.warn('On-the-fly geocoding origin failed:', err)
          }

          // Preset fallback
          if (!activeOriginCoords) {
            const clean = filters.origin.trim().toLowerCase()
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
            const found = Object.keys(LOCAL_PRESETS).find(k => clean.includes(k))
            if (found) {
              activeOriginCoords = LOCAL_PRESETS[found]
              setSearchOriginCoords(activeOriginCoords)
            }
          }
        }

        // Geocode destination on-the-fly if coords are missing
        if (!activeDestCoords && filters.destination) {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(filters.destination)}&countrycodes=in&limit=1`, {
              headers: { 'User-Agent': 'EcoRide-App-Phase2' }
            })
            if (res.ok) {
              const data = await res.json()
              if (data && data[0]) {
                activeDestCoords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
                setSearchDestinationCoords(activeDestCoords)
              }
            }
          } catch (err) {
            console.warn('On-the-fly geocoding destination failed:', err)
          }

          // Preset fallback
          if (!activeDestCoords) {
            const clean = filters.destination.trim().toLowerCase()
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
            const found = Object.keys(LOCAL_PRESETS).find(k => clean.includes(k))
            if (found) {
              activeDestCoords = LOCAL_PRESETS[found]
              setSearchDestinationCoords(activeDestCoords)
            }
          }
        }

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

        const { data } = await api.get(`/rides/search?${params.toString()}`)
        results = data.rides
      }

      setRides(results)
      
      if (results.length === 0) {
        toast('No rides found matching filters.', { icon: '🔍' })
      } else {
        setActiveRide(results[0])
      }
    } catch (error) {
      toast.error('Failed to search rides')
    } finally {
      setLoading(false)
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
                  markers={[
                    ...(searchOriginCoords ? [{ coordinates: searchOriginCoords, label: 'Your Pickup', color: 'green' }] : []),
                    ...(searchDestinationCoords ? [{ coordinates: searchDestinationCoords, label: 'Your Dropoff', color: 'red' }] : [])
                  ]}
                />
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchRide
