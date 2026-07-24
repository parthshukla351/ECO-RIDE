import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FaSearch, FaFilter, FaLeaf, FaCar, FaStar, 
  FaMapMarkerAlt, FaClock, FaUsers, FaRoute,
  FaBolt, FaShieldAlt
} from 'react-icons/fa'
import api from '../services/api'
import toast from 'react-hot-toast'

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

  useEffect(() => {
    if (filters.origin && filters.destination) {
      searchRides()
    }
  }, [])

  const searchRides = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key])
      })

      const { data } = await api.get(`/rides/search?${params.toString()}`)
      setRides(data.rides)
      
      if (data.rides.length === 0) {
        toast('No rides found. Try adjusting your search.', { icon: '🔍' })
      }
    } catch (error) {
      toast.error('Failed to search rides')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (!filters.origin || !filters.destination) {
      toast.error('Please enter origin and destination')
      return
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
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-black text-white mb-2">
            Find Your Eco Ride 🌱
          </h1>
          <p className="text-gray-400">Search sustainable rides to your destination</p>
        </motion.div>

        {/* Search Form */}
        <div className="card mb-6">
          <form onSubmit={handleSearch}>
            <div className="grid md:grid-cols-5 gap-4">
              {/* Origin */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  From
                </label>
                <div className="relative">
                  <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    name="origin"
                    value={filters.origin}
                    onChange={handleChange}
                    placeholder="Delhi"
                    className="input-field pl-10"
                  />
                </div>
              </div>

              {/* Destination */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  To
                </label>
                <div className="relative">
                  <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    name="destination"
                    value={filters.destination}
                    onChange={handleChange}
                    placeholder="Mumbai"
                    className="input-field pl-10"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={filters.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="input-field"
                />
              </div>

              {/* Seats */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Seats
                </label>
                <select
                  name="seats"
                  value={filters.seats}
                  onChange={handleChange}
                  className="input-field"
                >
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <option key={n} value={n}>{n} seat{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              {/* Search Button */}
              <div className="md:col-span-3 flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <FaSearch /> Search Rides
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`btn-outline flex items-center gap-2 ${showFilters ? 'bg-primary-500/10' : ''}`}
                >
                  <FaFilter /> Filters
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-700"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Vehicle Type
                  </label>
                  <select
                    name="vehicleType"
                    value={filters.vehicleType}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">All Types</option>
                    <option value="electric">⚡ Electric</option>
                    <option value="hybrid">🔋 Hybrid</option>
                    <option value="petrol">⛽ Petrol</option>
                    <option value="diesel">🛢️ Diesel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Price (₹)
                  </label>
                  <input
                    type="number"
                    name="maxPrice"
                    value={filters.maxPrice}
                    onChange={handleChange}
                    placeholder="500"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sort By
                  </label>
                  <select
                    name="sortBy"
                    value={filters.sortBy}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="departureTime">Departure Time</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                    <option value="eco">Most Eco-Friendly</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="womenOnly"
                      checked={filters.womenOnly}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-300">Women Only Rides</span>
                  </label>
                </div>
              </motion.div>
            )}
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Finding eco-friendly rides...</p>
          </div>
        ) : rides.length === 0 ? (
          <div className="card text-center py-12">
            <FaCar className="text-gray-600 text-5xl mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No rides found</h3>
            <p className="text-gray-400 mb-6">
              Try adjusting your search filters or check back later
            </p>
            <button
              onClick={() => setFilters({
                ...filters,
                vehicleType: '',
                maxPrice: '',
                womenOnly: false
              })}
              className="btn-outline"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400">
                Found <span className="text-white font-semibold">{rides.length}</span> ride{rides.length !== 1 ? 's' : ''}
              </p>
            </div>

            {rides.map((ride) => (
              <motion.div
                key={ride._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/ride/${ride._id}`)}
                className="card hover:border-primary-500/50 cursor-pointer group"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Driver Info */}
                  <div className="flex items-center gap-4">
                    <img
                      src={ride.driver.avatar}
                      alt={ride.driver.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary-500"
                    />
                    <div>
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        {ride.driver.name}
                        {ride.driver.safetyScore >= 90 && (
                          <FaShieldAlt className="text-green-400 text-sm" title="Verified Safe" />
                        )}
                      </h3>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-1 text-yellow-400">
                          <FaStar className="text-xs" />
                          <span>{ride.driver.averageRating?.toFixed(1) || '0.0'}</span>
                        </div>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400">{ride.driver.totalRides} rides</span>
                      </div>
                      <div className="eco-badge mt-1">
                        <FaLeaf className="text-xs" />
                        {ride.driver.ecoLevel}
                      </div>
                    </div>
                  </div>

                  {/* Route Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div>
                        <p className="text-gray-400 text-xs">From</p>
                        <p className="text-white font-semibold">{ride.origin.city}</p>
                      </div>
                      <FaRoute className="text-primary-400" />
                      <div>
                        <p className="text-gray-400 text-xs">To</p>
                        <p className="text-white font-semibold">{ride.destination.city}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm">
                      <div className="flex items-center gap-1 text-gray-400">
                        <FaClock className="text-primary-400" />
                        {new Date(ride.departureTime).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <FaUsers className="text-primary-400" />
                        {ride.availableSeats} seat{ride.availableSeats !== 1 ? 's' : ''} available
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        {vehicleIcons[ride.vehicleType]}
                        <span className="capitalize">{ride.vehicleType}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {ride.preferences?.womenOnly && (
                        <span className="px-2 py-1 bg-pink-500/20 text-pink-400 text-xs rounded-full">
                          Women Only
                        </span>
                      )}
                      {ride.preferences?.acAvailable && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                          AC
                        </span>
                      )}
                      {ride.vehicleType === 'electric' && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                          <FaBolt className="text-xs" /> Zero Emission
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="flex flex-col justify-between items-end">
                    <div className="text-right">
                      <p className="text-gray-400 text-xs mb-1">Price per seat</p>
                      <p className="text-3xl font-black text-primary-400">₹{ride.pricePerSeat}</p>
                      {ride.aiSuggestedPrice && ride.aiSuggestedPrice < ride.pricePerSeat && (
                        <p className="text-xs text-gray-500">AI suggests: ₹{ride.aiSuggestedPrice}</p>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="eco-badge mb-2">
                        <FaLeaf className="text-xs" />
                        {ride.carbonSaved?.toFixed(2)} kg CO₂ saved
                      </div>
                      <button className="btn-primary text-sm px-4 py-2 group-hover:bg-primary-400">
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchRide