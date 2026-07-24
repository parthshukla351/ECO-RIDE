import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FaMapMarkerAlt, FaClock, FaCar, FaUsers, FaStar,
  FaLeaf, FaShieldAlt, FaCheck, FaTimes, FaPhone,
  FaEnvelope, FaRoute, FaBolt, FaCheckCircle
} from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'

const RideDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  
  const [ride, setRide] = useState(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [seatsToBook, setSeatsToBook] = useState(1)

  useEffect(() => {
    fetchRideDetails()
  }, [id])

  const fetchRideDetails = async () => {
    try {
      const { data } = await api.get(`/rides/${id}`)
      setRide(data.ride)
    } catch (error) {
      toast.error('Failed to load ride details')
      navigate('/search')
    } finally {
      setLoading(false)
    }
  }

  const handleBookRide = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to book a ride')
      navigate('/login', { state: { from: `/ride/${id}` } })
      return
    }

    if (user.role !== 'passenger') {
      toast.error('Only passengers can book rides')
      return
    }

    setBooking(true)
    try {
      const { data } = await api.post('/bookings', {
        rideId: id,
        seatsBooked: seatsToBook
      })
      
      toast.success('Booking request sent to driver!')
      navigate('/bookings')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to book ride')
    } finally {
      setBooking(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!ride) return null

  const isOwnRide = user?._id === ride.driver._id
  const canBook = isAuthenticated && user?.role === 'passenger' && !isOwnRide && ride.availableSeats > 0

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white mb-6 flex items-center gap-2"
        >
          ← Back to search
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ride Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-black text-white flex items-center gap-3">
                  <FaRoute className="text-primary-400" />
                  {ride.origin.city} → {ride.destination.city}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium
                  ${ride.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                    ride.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                    ride.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                  {ride.status}
                </span>
              </div>

              {/* Route Details */}
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-400 text-sm">Pickup</p>
                    <p className="text-white font-semibold">{ride.origin.address}</p>
                    <p className="text-gray-500 text-sm">{ride.origin.city}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-primary-400 font-semibold">
                      {new Date(ride.departureTime).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {new Date(ride.departureTime).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 pl-5">
                  <div className="w-px h-12 bg-gradient-to-b from-green-500 to-red-500"></div>
                  <div className="text-gray-400 text-sm">
                    {ride.distance} km • {ride.duration} min
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaMapMarkerAlt className="text-red-500 text-sm" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-400 text-sm">Drop-off</p>
                    <p className="text-white font-semibold">{ride.destination.address}</p>
                    <p className="text-gray-500 text-sm">{ride.destination.city}</p>
                  </div>
                </div>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-700">
                <div className="text-center">
                  <FaUsers className="text-primary-400 text-xl mx-auto mb-2" />
                  <p className="text-white font-semibold">{ride.availableSeats}</p>
                  <p className="text-gray-400 text-xs">Seats Left</p>
                </div>
                <div className="text-center">
                  <FaCar className="text-primary-400 text-xl mx-auto mb-2" />
                  <p className="text-white font-semibold capitalize">{ride.vehicleType}</p>
                  <p className="text-gray-400 text-xs">Vehicle</p>
                </div>
                <div className="text-center">
                  <FaLeaf className="text-primary-400 text-xl mx-auto mb-2" />
                  <p className="text-white font-semibold">{ride.carbonSaved?.toFixed(2)} kg</p>
                  <p className="text-gray-400 text-xs">CO₂ Saved</p>
                </div>
                <div className="text-center">
                  <div className="text-primary-400 text-xl mx-auto mb-2">₹</div>
                  <p className="text-white font-semibold">{ride.pricePerSeat}</p>
                  <p className="text-gray-400 text-xs">Per Seat</p>
                </div>
              </div>
            </motion.div>

            {/* Driver Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card"
            >
              <h2 className="text-xl font-bold text-white mb-4">Driver Details</h2>
              <div className="flex items-start gap-4">
                <img
                  src={ride.driver.avatar}
                  alt={ride.driver.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-primary-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-bold text-lg">{ride.driver.name}</h3>
                    {ride.driver.safetyScore >= 90 && (
                      <FaShieldAlt className="text-green-400" title="Verified Safe Driver" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1 text-yellow-400">
                      <FaStar className="text-sm" />
                      <span className="font-semibold">{ride.driver.averageRating?.toFixed(1) || '0.0'}</span>
                      <span className="text-gray-500 text-sm">({ride.driver.totalRatings} reviews)</span>
                    </div>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400 text-sm">{ride.driver.totalRides} rides</span>
                  </div>
                  <div className="eco-badge inline-flex">
                    <FaLeaf className="text-xs" />
                    {ride.driver.ecoLevel} • {ride.driver.totalCO2Saved?.toFixed(1)} kg CO₂ saved
                  </div>

                  {canBook && (
                    <div className="flex gap-2 mt-4">
                      <a
                        href={`tel:${ride.driver.phone}`}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-white transition-colors"
                      >
                        <FaPhone className="text-primary-400" />
                        Call
                      </a>
                      <a
                        href={`mailto:${ride.driver.email}`}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-white transition-colors"
                      >
                        <FaEnvelope className="text-primary-400" />
                        Email
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle Details */}
              {ride.driver.vehicleDetails && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <h3 className="text-white font-semibold mb-3">Vehicle Information</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-400">Make & Model</p>
                      <p className="text-white font-medium">
                        {ride.driver.vehicleDetails.make} {ride.driver.vehicleDetails.model}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Year</p>
                      <p className="text-white font-medium">{ride.driver.vehicleDetails.year}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Color</p>
                      <p className="text-white font-medium">{ride.driver.vehicleDetails.color}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">License Plate</p>
                      <p className="text-white font-medium">{ride.driver.vehicleDetails.licensePlate}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Ride Preferences */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <h2 className="text-xl font-bold text-white mb-4">Ride Preferences</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'womenOnly', label: 'Women Only', icon: '👩' },
                  { key: 'petsAllowed', label: 'Pets Allowed', icon: '🐕' },
                  { key: 'smokingAllowed', label: 'Smoking', icon: '🚬' },
                  { key: 'musicAllowed', label: 'Music', icon: '🎵' },
                  { key: 'acAvailable', label: 'AC', icon: '❄️' },
                  { key: 'luggageAllowed', label: 'Luggage', icon: '🧳' }
                ].map(pref => (
                  <div
                    key={pref.key}
                    className={`flex items-center gap-2 p-3 rounded-lg border
                      ${ride.preferences?.[pref.key]
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                      }`}
                  >
                    {ride.preferences?.[pref.key] ? (
                      <FaCheck className="text-sm" />
                    ) : (
                      <FaTimes className="text-sm" />
                    )}
                    <span className="text-sm">{pref.icon} {pref.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="card bg-gradient-to-br from-primary-900/20 to-emerald-900/20 border-primary-500/30"
              >
                <div className="text-center mb-6">
                  <p className="text-gray-400 text-sm mb-2">Price per seat</p>
                  <p className="text-5xl font-black text-primary-400">₹{ride.pricePerSeat}</p>
                  {ride.aiSuggestedPrice && (
                    <p className="text-xs text-gray-500 mt-1">
                      AI suggests: ₹{ride.aiSuggestedPrice}
                    </p>
                  )}
                </div>

                {canBook ? (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Number of Seats
                      </label>
                      <select
                        value={seatsToBook}
                        onChange={(e) => setSeatsToBook(parseInt(e.target.value))}
                        className="input-field"
                      >
                        {Array.from({ length: ride.availableSeats }, (_, i) => i + 1).map(n => (
                          <option key={n} value={n}>
                            {n} seat{n > 1 ? 's' : ''} - ₹{n * ride.pricePerSeat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2 mb-6 text-sm">
                      <div className="flex justify-between text-gray-400">
                        <span>Seats × Price</span>
                        <span>{seatsToBook} × ₹{ride.pricePerSeat}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-white pt-2 border-t border-gray-700">
                        <span>Total</span>
                        <span>₹{seatsToBook * ride.pricePerSeat}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleBookRide}
                      disabled={booking}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      {booking ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Booking...
                        </>
                      ) : (
                        <>
                          <FaCheckCircle /> Book This Ride
                        </>
                      )}
                    </button>

                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
                        <FaLeaf />
                        <span className="font-semibold">Eco Impact</span>
                      </div>
                      <p className="text-gray-400 text-xs">
                        You'll save {(ride.carbonSaved / ride.totalSeats * seatsToBook).toFixed(2)} kg of CO₂
                        and earn {Math.round(ride.carbonSaved / ride.totalSeats * seatsToBook * 10)} eco points!
                      </p>
                    </div>
                  </>
                ) : isOwnRide ? (
                  <div className="text-center py-6">
                    <p className="text-gray-400 mb-4">This is your ride</p>
                    <button
                      onClick={() => navigate('/driver/rides')}
                      className="btn-outline w-full"
                    >
                      Manage Ride
                    </button>
                  </div>
                ) : ride.availableSeats === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-red-400 mb-2">Ride is full</p>
                    <p className="text-gray-500 text-sm">No seats available</p>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-400 mb-4">Login to book this ride</p>
                    <button
                      onClick={() => navigate('/login', { state: { from: `/ride/${id}` } })}
                      className="btn-primary w-full"
                    >
                      Login / Register
                    </button>
                  </div>
                )}

                {ride.vehicleType === 'electric' && (
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center gap-2">
                    <FaBolt className="text-blue-400" />
                    <p className="text-blue-400 text-xs font-medium">
                      100% Zero Emission Ride
                    </p>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RideDetails