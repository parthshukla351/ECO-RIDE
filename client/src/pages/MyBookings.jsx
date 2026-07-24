import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FaCar, FaMapMarkerAlt, FaClock, FaLeaf, FaStar,
  FaTimes, FaPhone, FaComments
} from 'react-icons/fa'
import api from '../services/api'
import toast from 'react-hot-toast'

const MyBookings = () => {
  const [bookings, setBookings] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBookings()
  }, [filter])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const { data } = await api.get(`/bookings/my-bookings${params}`)
      setBookings(data.bookings)
    } catch (error) {
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId) => {
    const reason = prompt('Enter cancellation reason (optional):')
    if (reason === null) return

    try {
      await api.put(`/bookings/${bookingId}/cancel`, { reason })
      toast.success('Booking cancelled')
      fetchBookings()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel')
    }
  }

  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    confirmed: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
    cancelled: 'bg-gray-500/20 text-gray-400',
    completed: 'bg-blue-500/20 text-blue-400'
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">My Bookings 🎫</h1>
          <p className="text-gray-400">Track your ride bookings</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'confirmed', label: 'Confirmed' },
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

        {/* Bookings List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="card text-center py-12">
            <FaCar className="text-gray-600 text-5xl mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No bookings found</h3>
            <p className="text-gray-400 mb-6">
              {filter === 'all' 
                ? "You haven't booked any rides yet" 
                : `No ${filter} bookings`
              }
            </p>
            <Link to="/search" className="btn-primary inline-flex items-center gap-2">
              Find a Ride
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking, index) => (
              <motion.div
                key={booking._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card hover:border-primary-500/50"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Ride Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                        {booking.status}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {new Date(booking.ride?.departureTime).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <div>
                        <p className="text-gray-400 text-xs">From</p>
                        <p className="text-white font-semibold">{booking.ride?.origin?.city}</p>
                      </div>
                      <FaMapMarkerAlt className="text-primary-400" />
                      <div>
                        <p className="text-gray-400 text-xs">To</p>
                        <p className="text-white font-semibold">{booking.ride?.destination?.city}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <img
                        src={booking.driver?.avatar}
                        alt={booking.driver?.name}
                        className="w-10 h-10 rounded-full border-2 border-primary-500"
                      />
                      <div>
                        <p className="text-white font-medium">{booking.driver?.name}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="flex items-center gap-1 text-yellow-400">
                            <FaStar className="text-xs" />
                            <span>{booking.driver?.averageRating?.toFixed(1) || '0.0'}</span>
                          </div>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-400">{booking.driver?.totalRides} rides</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <FaClock className="text-primary-400" />
                        {new Date(booking.ride?.departureTime).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="flex items-center gap-1">
                        <FaCar className="text-primary-400" />
                        {booking.seatsBooked} seat{booking.seatsBooked !== 1 ? 's' : ''}
                      </div>
                      {booking.carbonSaved > 0 && (
                        <div className="flex items-center gap-1">
                          <FaLeaf className="text-green-400" />
                          {booking.carbonSaved?.toFixed(2)} kg CO₂ saved
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pricing & Actions */}
                  <div className="flex lg:flex-col justify-between lg:justify-start gap-4">
                    <div className="text-center lg:text-right">
                      <p className="text-gray-400 text-xs mb-1">Total Amount</p>
                      <p className="text-2xl font-black text-primary-400">₹{booking.totalAmount}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {booking.paymentStatus === 'paid' ? '✓ Paid' : 'Payment ' + booking.paymentStatus}
                      </p>
                    </div>

                    {booking.ecoPointsEarned > 0 && (
                      <div className="text-center lg:text-right">
                        <p className="text-gray-400 text-xs mb-1">Eco Points</p>
                        <p className="text-lg font-bold text-green-400">+{booking.ecoPointsEarned}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex lg:flex-col gap-2">
                    {booking.status === 'pending' && (
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        className="btn-outline text-sm px-4 py-2 flex items-center gap-2 text-red-400 border-red-500/30 hover:bg-red-500/10"
                      >
                        <FaTimes /> Cancel
                      </button>
                    )}

                    {booking.status === 'confirmed' && (
                      <>
                        <a
                          href={`tel:${booking.driver?.phone}`}
                          className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                        >
                          <FaPhone /> Call Driver
                        </a>
                        <Link
                          to={`/chat/${booking.ride?._id}`}
                          className="btn-outline text-sm px-4 py-2 flex items-center gap-2"
                        >
                          <FaComments /> Chat
                        </Link>
                      </>
                    )}

                    {booking.status === 'completed' && !booking.driverRating && (
                      <Link
                        to={`/review/${booking._id}`}
                        className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                      >
                        <FaStar /> Rate Driver
                      </Link>
                    )}

                    <Link
                      to={`/ride/${booking.ride?._id}`}
                      className="btn-outline text-sm px-4 py-2"
                    >
                      View Details
                    </Link>
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

export default MyBookings