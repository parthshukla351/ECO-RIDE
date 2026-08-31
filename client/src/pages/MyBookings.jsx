import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FaCar, FaMapMarkerAlt, FaClock, FaLeaf, FaStar,
  FaTimes, FaPhone, FaComments, FaCreditCard
} from 'react-icons/fa'
import GlassCard from '../components/ui/GlassCard'
import AnimatedButton from '../components/ui/AnimatedButton'
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
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    confirmed: 'bg-green-500/10 text-green-400 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    cancelled: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-black font-display text-white tracking-tight">My Bookings 🎫</h1>
        <p className="text-gray-400 text-sm font-medium mt-1">Review your reservations, status details, and driver ratings.</p>
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/5 scrollbar-thin">
        {[
          { value: 'all', label: 'All Bookings' },
          { value: 'pending', label: 'Pending' },
          { value: 'confirmed', label: 'Confirmed' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' }
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border
              ${filter === tab.value
                ? 'bg-primary-500/10 text-primary-400 border-primary-500/25 shadow-sm shadow-primary-500/5'
                : 'bg-dark-900/40 text-gray-400 border-transparent hover:text-white'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="text-center py-16 space-y-4">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">Loading bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <GlassCard hoverable={false} className="text-center py-16 space-y-6 border-white/5 bg-dark-900/40">
          <FaCar className="text-gray-600 text-5xl mx-auto opacity-35" />
          <div>
            <h3 className="text-xl font-bold text-white font-display">No Bookings Found</h3>
            <p className="text-gray-400 text-sm mt-1">
              {filter === 'all' 
                ? "You haven't reserved any shared rides yet." 
                : `No ${filter} bookings matches found.`
              }
            </p>
          </div>
          <Link to="/search">
            <AnimatedButton variant="primary" className="text-xs uppercase tracking-wider font-bold">
              Find Your First Commute
            </AnimatedButton>
          </Link>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking, idx) => (
            <motion.div
              key={booking._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
            >
              <GlassCard hoverable={false} className="border-white/5 bg-dark-900/50 p-6">
                <div className="flex flex-col lg:flex-row gap-6 justify-between lg:items-center">
                  
                  {/* Left: Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black tracking-wider border ${statusColors[booking.status]}`}>
                        {booking.status}
                      </span>
                      <span className="text-gray-500 text-[10px] font-bold">
                        {new Date(booking.ride?.departureTime).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-gray-500">From</span>
                        <p className="text-white font-semibold text-sm">{booking.ride?.origin?.city}</p>
                      </div>
                      <FaMapMarkerAlt className="text-primary-400 text-xs mt-3" />
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-gray-500">To</span>
                        <p className="text-white font-semibold text-sm">{booking.ride?.destination?.city}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <img
                        src={booking.driver?.avatar || 'https://res.cloudinary.com/demo/image/upload/v1/default-avatar.png'}
                        alt={booking.driver?.name}
                        className="w-10 h-10 rounded-full object-cover border border-white/10"
                      />
                      <div>
                        <p className="text-white font-bold text-sm leading-tight">{booking.driver?.name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1 font-semibold">
                          <span className="text-yellow-400">★ {booking.driver?.averageRating?.toFixed(1) || '0.0'}</span>
                          <span>•</span>
                          <span>{booking.driver?.totalRides || 0} rides completed</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-400 pt-1">
                      <span className="flex items-center gap-1">
                        <FaClock className="text-primary-400 text-[10px]" />
                        {new Date(booking.ride?.departureTime).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <FaCar className="text-primary-400 text-[10px]" />
                        {booking.seatsBooked} seat{booking.seatsBooked !== 1 ? 's' : ''} {booking.seats && booking.seats.length > 0 && `(Seat: ${booking.seats.join(', ')})`}
                      </span>
                      {booking.carbonSaved > 0 && (
                        <span className="flex items-center gap-1 text-green-400">
                          <FaLeaf className="text-[10px]" />
                          {booking.carbonSaved?.toFixed(2)} kg CO₂ saved
                        </span>
                      )}
                    </div>

                    {booking.isSharedRideCandidate && (
                      <div className="mt-4 bg-white/5 border border-white/5 p-4 rounded-xl space-y-2 text-xs font-semibold text-gray-300">
                        <div className="text-[10px] font-black uppercase text-gray-500 tracking-wider pb-1 border-b border-white/5">
                          Shared Ride Cost-Split Breakdown
                        </div>
                        {booking.originalPassenger1Fare > 0 ? (
                          // Passenger 1 View
                          <div className="space-y-1.5">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Original Fare:</span>
                              <span className="text-white">₹{booking.originalPassenger1Fare}</span>
                            </div>
                            <div className="flex justify-between text-green-400">
                              <span>Shared Route Saving:</span>
                              <span>-₹{booking.sharedRideAdjustment}</span>
                            </div>
                            {booking.trafficCharge > 0 && (
                              <div className="flex justify-between text-yellow-400">
                                <span>Traffic Surcharge:</span>
                                <span>+₹{booking.trafficCharge}</span>
                              </div>
                            )}
                            {booking.passengerLateCharge > 0 && (
                              <div className="flex justify-between text-green-400">
                                <span>Waiting Adjustment (Late Passenger 2):</span>
                                <span>-₹{booking.passengerLateCharge}</span>
                              </div>
                            )}
                            <div className="border-t border-white/5 my-1 pt-1 flex justify-between font-bold text-primary-400">
                              <span>Updated Fare:</span>
                              <span>₹{booking.totalAmount}</span>
                            </div>
                            <p className="text-[9px] text-gray-500 font-bold leading-normal pt-1 text-center">
                              *Fare reduced because route is being shared with another rider.
                            </p>
                          </div>
                        ) : (
                          // Passenger 2 View
                          <div className="space-y-1.5">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Route Fare:</span>
                              <span className="text-white">₹{booking.originalFare || booking.totalAmount}</span>
                            </div>
                            {booking.trafficCharge > 0 && (
                              <div className="flex justify-between text-yellow-400">
                                <span>Traffic Surcharge:</span>
                                <span>+₹{booking.trafficCharge}</span>
                              </div>
                            )}
                            {booking.passengerLateCharge > 0 && (
                              <div className="flex justify-between text-red-400">
                                <span>Late Pickup Charge:</span>
                                <span>+₹{booking.passengerLateCharge}</span>
                              </div>
                            )}
                            <div className="border-t border-white/5 my-1 pt-1 flex justify-between font-bold text-primary-400">
                              <span>Final Fare:</span>
                              <span>₹{booking.totalAmount}</span>
                            </div>
                            <p className="text-[9px] text-gray-500 font-bold leading-normal pt-1 text-center">
                              *Fare computed dynamically based on segment coordinates.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Middle: Details */}
                  <div className="flex lg:flex-col justify-between items-start lg:items-end gap-2 border-t lg:border-t-0 border-white/5 pt-4 lg:pt-0">
                    <div className="text-left lg:text-right">
                      <span className="text-[9px] uppercase tracking-wider text-gray-500">Seat Price</span>
                      <p className="text-xl font-black text-primary-400 font-display">₹{booking.totalAmount}</p>
                      <span className="text-[10px] text-gray-500 mt-0.5 block font-bold">
                        {booking.paymentStatus === 'paid' ? '✓ PAID' : 'PENDING'}
                      </span>
                    </div>

                    {booking.ecoPointsEarned > 0 && (
                      <div className="text-left lg:text-right">
                        <span className="text-[9px] uppercase tracking-wider text-gray-500">Eco Points</span>
                        <p className="text-sm font-bold text-green-400">+{booking.ecoPointsEarned} PTS</p>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap lg:flex-col gap-2 border-t lg:border-t-0 border-white/5 pt-4 lg:pt-0">
                    {booking.paymentStatus === 'pending' && booking.status !== 'cancelled' && booking.status !== 'rejected' && (
                      <Link to={`/checkout/${booking._id}`} className="flex-1 lg:flex-none">
                        <AnimatedButton
                          variant="primary"
                          className="w-full text-xs uppercase tracking-wider py-2.5 flex items-center justify-center gap-1.5"
                        >
                          <FaCreditCard className="text-[10px]" /> Pay Now
                        </AnimatedButton>
                      </Link>
                    )}

                    {booking.status === 'pending' && (
                      <AnimatedButton
                        onClick={() => handleCancelBooking(booking._id)}
                        variant="danger"
                        className="text-xs uppercase tracking-wider py-2.5"
                      >
                        <FaTimes className="text-[10px]" /> Cancel
                      </AnimatedButton>
                    )}

                    {booking.status === 'confirmed' && (
                      <>
                        <a href={`tel:${booking.driver?.phone}`} className="flex-1 lg:flex-none">
                          <AnimatedButton variant="primary" className="w-full text-xs uppercase tracking-wider py-2.5">
                            <FaPhone className="text-[10px]" /> Call Driver
                          </AnimatedButton>
                        </a>
                        <Link to={`/chat/${booking.ride?._id}`} className="flex-1 lg:flex-none">
                          <AnimatedButton variant="secondary" className="w-full text-xs uppercase tracking-wider py-2.5">
                            <FaComments className="text-[10px]" /> Chat Box
                          </AnimatedButton>
                        </Link>
                      </>
                    )}

                    {booking.status === 'completed' && !booking.driverRating && (
                      <Link to={`/review/${booking._id}`} className="flex-1 lg:flex-none">
                        <AnimatedButton variant="primary" className="w-full text-xs uppercase tracking-wider py-2.5">
                          <FaStar className="text-[10px]" /> Rate Trip
                        </AnimatedButton>
                      </Link>
                    )}

                    <Link to={`/ride/${booking.ride?._id}`} className="flex-1 lg:flex-none">
                      <AnimatedButton variant="secondary" className="w-full text-xs uppercase tracking-wider py-2.5">
                        Details
                      </AnimatedButton>
                    </Link>
                  </div>

                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyBookings
