import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FaCar, FaUsers, FaMapMarkerAlt, FaClock, FaLeaf,
  FaEdit, FaTrash, FaPlay, FaStop, FaTimes
} from 'react-icons/fa'
import api from '../services/api'
import toast from 'react-hot-toast'

const MyRides = () => {
  const [rides, setRides] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRides()
  }, [filter])

  const fetchRides = async () => {
    setLoading(true)
    try {
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const { data } = await api.get(`/rides/driver/my-rides${params}`)
      setRides(data.rides)
    } catch (error) {
      toast.error('Failed to load rides')
    } finally {
      setLoading(false)
    }
  }

  const handleStartRide = async (rideId) => {
    try {
      await api.put(`/rides/${rideId}/start`)
      toast.success('Ride started! 🚗')
      fetchRides()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start ride')
    }
  }

  const handleEndRide = async (rideId) => {
    if (!confirm('Are you sure you want to end this ride?')) return
    try {
      await api.put(`/rides/${rideId}/end`)
      toast.success('Ride completed! ✅')
      fetchRides()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to end ride')
    }
  }

  const handleCancelRide = async (rideId) => {
    const reason = prompt('Enter cancellation reason (optional):')
    if (reason === null) return
    
    try {
      await api.put(`/rides/${rideId}/cancel`, { reason })
      toast.success('Ride cancelled')
      fetchRides()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel ride')
    }
  }

  const statusColors = {
    scheduled: 'bg-blue-500/20 text-blue-400',
    in_progress: 'bg-yellow-500/20 text-yellow-400',
    completed: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400'
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white mb-2">My Rides 🚗</h1>
            <p className="text-gray-400">Manage your published rides</p>
          </div>
          <Link to="/driver/publish-ride" className="btn-primary">
            + Publish New Ride
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { value: 'all', label: 'All Rides' },
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' }
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                filter === tab.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Rides List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : rides.length === 0 ? (
          <div className="card text-center py-12">
            <FaCar className="text-gray-600 text-5xl mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No rides found</h3>
            <p className="text-gray-400 mb-6">
              {filter === 'all' 
                ? "You haven't published any rides yet" 
                : `No ${filter} rides`
              }
            </p>
            <Link to="/driver/publish-ride" className="btn-primary inline-flex items-center gap-2">
              + Publish Your First Ride
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {rides.map((ride, index) => (
              <motion.div
                key={ride._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card hover:border-primary-500/50"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Route Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[ride.status]}`}>
                        {ride.status}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {new Date(ride.departureTime).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <div>
                        <p className="text-gray-400 text-xs">From</p>
                        <p className="text-white font-semibold">{ride.origin.city}</p>
                      </div>
                      <FaMapMarkerAlt className="text-primary-400" />
                      <div>
                        <p className="text-gray-400 text-xs">To</p>
                        <p className="text-white font-semibold">{ride.destination.city}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <FaClock className="text-primary-400" />
                        {new Date(ride.departureTime).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="flex items-center gap-1">
                        <FaUsers className="text-primary-400" />
                        {ride.totalSeats - ride.availableSeats}/{ride.totalSeats} booked
                      </div>
                      <div className="flex items-center gap-1">
                        <FaCar className="text-primary-400" />
                        {ride.distance} km
                      </div>
                      <div className="flex items-center gap-1">
                        <FaLeaf className="text-primary-400" />
                        {ride.carbonSaved?.toFixed(2)} kg CO₂
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex lg:flex-col justify-between lg:justify-start gap-4">
                    <div className="text-center lg:text-right">
                      <p className="text-gray-400 text-xs mb-1">Price/Seat</p>
                      <p className="text-2xl font-black text-primary-400">₹{ride.pricePerSeat}</p>
                    </div>
                    <div className="text-center lg:text-right">
                      <p className="text-gray-400 text-xs mb-1">Potential Earnings</p>
                      <p className="text-lg font-bold text-white">
                        ₹{(ride.totalSeats - ride.availableSeats) * ride.pricePerSeat}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-2 justify-end">
                    {ride.status === 'scheduled' && (
                      <>
                        <button
                          onClick={() => handleStartRide(ride._id)}
                          className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                          title="Start Ride"
                        >
                          <FaPlay /> Start
                        </button>
                        <Link
                          to={`/ride/${ride._id}`}
                          className="btn-outline text-sm px-4 py-2 flex items-center gap-2"
                        >
                          <FaEdit /> View
                        </Link>
                        <button
                          onClick={() => handleCancelRide(ride._id)}
                          className="btn-outline text-sm px-4 py-2 flex items-center gap-2 text-red-400 border-red-500/30 hover:bg-red-500/10"
                          title="Cancel"
                        >
                          <FaTimes />
                        </button>
                      </>
                    )}

                    {ride.status === 'in_progress' && (
                      <>
                        <button
                          onClick={() => handleEndRide(ride._id)}
                          className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                        >
                          <FaStop /> End Ride
                        </button>
                        <Link
                          to={`/ride/${ride._id}`}
                          className="btn-outline text-sm px-4 py-2"
                        >
                          View Details
                        </Link>
                      </>
                    )}

                    {(ride.status === 'completed' || ride.status === 'cancelled') && (
                      <Link
                        to={`/ride/${ride._id}`}
                        className="btn-outline text-sm px-4 py-2"
                      >
                        View Details
                      </Link>
                    )}
                  </div>
                </div>

                {/* Bookings */}
                {ride.bookings && ride.bookings.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">
                      {ride.bookings.length} booking{ride.bookings.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ride.bookings.map((booking) => (
                        <Link
                          key={booking._id}
                          to={`/bookings/${booking._id}`}
                          className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
                        >
                          <img
                            src={booking.passenger?.avatar}
                            alt={booking.passenger?.name}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-white">{booking.passenger?.name}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${statusColors[booking.status]}`}>
                            {booking.status}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyRides