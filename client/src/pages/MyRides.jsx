import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FaCar, FaUsers, FaMapMarkerAlt, FaClock, FaLeaf,
  FaEdit, FaTrash, FaPlay, FaStop, FaTimes, FaRoute
} from 'react-icons/fa'
import GlassCard from '../components/ui/GlassCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useSocket } from '../contexts/SocketContext'

const MyRides = () => {
  const { socket } = useSocket()
  const [rides, setRides] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  // Geolocation watcher for active in_progress rides
  useEffect(() => {
    const activeRide = rides.find(r => r.status === 'in_progress')
    if (!activeRide || !socket) return

    socket.emit('joinRide', activeRide._id)

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }

        // 1. Emit location update via WebSockets for real-time tracking
        socket.emit('updateLocation', {
          rideId: activeRide._id,
          location
        })

        // 2. Persist to backend
        try {
          await api.post(`/rides/${activeRide._id}/location`, location)
        } catch (err) {
          console.warn('Persisting location failed:', err.message)
        }
      },
      (err) => console.warn('Active drive location watch error:', err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
      socket.emit('leaveRide', activeRide._id)
    }
  }, [rides, socket])

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

  const handleDriverArrived = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/driver-arrived`)
      toast.success('Arrival marked! Waiting timer started.')
      fetchRides()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark arrival')
    }
  }

  const handlePassengerArrived = async (bookingId) => {
    try {
      const { data } = await api.put(`/bookings/${bookingId}/passenger-arrived`)
      if (data.booking.passengerLateCharge > 0) {
        toast.success(`Passenger boarded! Late fee of ₹${data.booking.passengerLateCharge} charged.`)
      } else {
        toast.success('Passenger boarded!')
      }
      fetchRides()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark boarding')
    }
  }

  const handleUpdateTraffic = async (rideId, newDelaySeconds) => {
    try {
      const { data } = await api.put(`/bookings/ride/${rideId}/traffic`, { trafficDelaySeconds: newDelaySeconds })
      toast.success(`Traffic delay updated! Surcharge: ₹${data.trafficCharge}`)
      fetchRides()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update traffic delay')
    }
  }

  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
    }, 10000)
    return () => clearInterval(timer)
  }, [])

  const statusColors = {
    scheduled: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    in_progress: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    completed: 'bg-green-500/10 text-green-400 border border-green-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border border-red-500/20'
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-black font-display text-white tracking-tight">My Rides 🚗</h1>
          <p className="text-gray-400 text-sm font-medium mt-1">Configure and manage your published itineraries.</p>
        </div>
        <Link to="/driver/publish-ride">
          <AnimatedButton variant="primary" className="text-xs uppercase tracking-wider font-bold">
            + Publish New Ride
          </AnimatedButton>
        </Link>
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/5 scrollbar-thin">
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

      {/* Rides List */}
      {loading ? (
        <div className="text-center py-16 space-y-4">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">Loading rides...</p>
        </div>
      ) : rides.length === 0 ? (
        <GlassCard hoverable={false} className="text-center py-16 space-y-6 border-white/5 bg-dark-900/40">
          <FaCar className="text-gray-600 text-5xl mx-auto opacity-35" />
          <div>
            <h3 className="text-xl font-bold text-white font-display">No Rides Found</h3>
            <p className="text-gray-400 text-sm mt-1">
              {filter === 'all' 
                ? "You haven't published any rides yet." 
                : `No ${filter} rides published.`
              }
            </p>
          </div>
          <Link to="/driver/publish-ride">
            <AnimatedButton variant="primary" className="text-xs uppercase tracking-wider font-bold">
              Publish Your First Itinerary
            </AnimatedButton>
          </Link>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {rides.map((ride, idx) => (
            <motion.div
              key={ride._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
            >
              <GlassCard hoverable={false} className="border-white/5 bg-dark-900/50 p-6">
                <div className="flex flex-col lg:flex-row gap-6 justify-between lg:items-center">
                  
                  {/* Left: Ride details */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black tracking-wider border ${statusColors[ride.status]}`}>
                        {ride.status}
                      </span>
                      <span className="text-gray-500 text-[10px] font-bold">
                        {new Date(ride.departureTime).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-gray-500">From</span>
                        <p className="text-white font-semibold text-sm">{ride.origin.city}</p>
                      </div>
                      <FaRoute className="text-primary-400 text-xs mt-3" />
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-gray-500">To</span>
                        <p className="text-white font-semibold text-sm">{ride.destination.city}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-400 pt-1">
                      <span className="flex items-center gap-1">
                        <FaClock className="text-primary-400 text-[10px]" />
                        {new Date(ride.departureTime).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <FaUsers className="text-primary-400 text-[10px]" />
                        {ride.totalSeats - ride.availableSeats} of {ride.totalSeats} booked
                      </span>
                      <span className="flex items-center gap-1">
                        <FaCar className="text-primary-400 text-[10px]" />
                        {ride.distance} km distance
                      </span>
                      <span className="flex items-center gap-1 text-green-400">
                        <FaLeaf className="text-[10px]" />
                        {ride.carbonSaved?.toFixed(2)} kg CO₂ Offset
                      </span>
                    </div>
                  </div>

                  {/* Middle: Potential Earnings */}
                  <div className="flex lg:flex-col justify-between items-start lg:items-end gap-2 border-t lg:border-t-0 border-white/5 pt-4 lg:pt-0">
                    <div className="text-left lg:text-right">
                      <span className="text-[9px] uppercase tracking-wider text-gray-500">Seat pricing</span>
                      <p className="text-xl font-black text-primary-400 font-display">₹{ride.pricePerSeat}</p>
                    </div>

                    <div className="text-left lg:text-right">
                      <span className="text-[9px] uppercase tracking-wider text-gray-500">Booked value</span>
                      <p className="text-sm font-bold text-white">
                        ₹{(ride.totalSeats - ride.availableSeats) * ride.pricePerSeat}
                      </p>
                    </div>
                  </div>

                  {/* Right: Action controllers */}
                  <div className="flex flex-wrap lg:flex-col gap-2 border-t lg:border-t-0 border-white/5 pt-4 lg:pt-0">
                    {ride.status === 'scheduled' && (
                      <>
                        <AnimatedButton
                          onClick={() => handleStartRide(ride._id)}
                          variant="primary"
                          className="text-xs uppercase tracking-wider py-2.5 flex items-center gap-1.5"
                        >
                          <FaPlay className="text-[9px]" /> Start Drive
                        </AnimatedButton>
                        <AnimatedButton
                          onClick={() => handleCancelRide(ride._id)}
                          variant="danger"
                          className="text-xs uppercase tracking-wider py-2.5 flex items-center gap-1.5"
                        >
                          <FaTimes className="text-[9px]" /> Cancel
                        </AnimatedButton>
                      </>
                    )}

                    {ride.status === 'in_progress' && (
                      <AnimatedButton
                        onClick={() => handleEndRide(ride._id)}
                        variant="primary"
                        className="text-xs uppercase tracking-wider py-2.5 flex items-center gap-1.5"
                      >
                        <FaStop className="text-[9px]" /> End Drive
                      </AnimatedButton>
                    )}

                    <Link to={`/ride/${ride._id}`} className="w-full">
                      <AnimatedButton variant="secondary" fullWidth className="text-xs uppercase tracking-wider py-2.5">
                        Details
                      </AnimatedButton>
                    </Link>
                  </div>

                </div>

                {/* Bookings details list */}
                {ride.bookings && ride.bookings.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-white/5">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-2.5">
                      Roster: {ride.bookings.length} Passenger Reservation{ride.bookings.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ride.bookings.map((booking) => (
                        <div
                          key={booking._id}
                          className="flex items-center gap-2.5 px-3 py-1.5 bg-dark-950/60 border border-white/5 rounded-xl text-xs"
                        >
                          <img
                            src={booking.passenger?.avatar || 'https://res.cloudinary.com/demo/image/upload/v1/default-avatar.png'}
                            alt={booking.passenger?.name}
                            className="w-5 h-5 rounded-full object-cover border border-white/10"
                          />
                          <span className="text-white font-semibold">{booking.passenger?.name}</span>
                          {booking.seats && booking.seats.length > 0 && (
                            <span className="text-primary-400 font-bold text-[10px]">
                              (Seat: {booking.seats.join(', ')})
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${statusColors[booking.status]}`}>
                            {booking.status}
                          </span>

                          {booking.status === 'confirmed' && !booking.driverArrivedAt && (
                            <button
                              type="button"
                              onClick={() => handleDriverArrived(booking._id)}
                              className="ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded text-[9px] font-black uppercase hover:bg-yellow-500/35 cursor-pointer outline-none"
                            >
                              Arrived
                            </button>
                          )}

                          {booking.status === 'confirmed' && booking.driverArrivedAt && !booking.passengerArrivedAt && (
                            <div className="flex items-center gap-2">
                              {(() => {
                                const elapsedSeconds = Math.max(0, Math.floor((now - new Date(booking.driverArrivedAt)) / 1000));
                                const elapsedMinutes = Math.floor(elapsedSeconds / 60);
                                const waitingPenalty = elapsedMinutes * 1;
                                const mins = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
                                const secs = (elapsedSeconds % 60).toString().padStart(2, '0');
                                return (
                                  <span className="text-[10px] text-yellow-400 font-bold ml-1">
                                    Waiting: {mins}:{secs} (Penalty: ₹{waitingPenalty})
                                  </span>
                                );
                              })()}
                              <button
                                type="button"
                                onClick={() => handlePassengerArrived(booking._id)}
                                className="ml-1 px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-[9px] font-black uppercase hover:bg-green-500/35 cursor-pointer outline-none"
                              >
                                Boarded
                              </button>
                            </div>
                          )}

                          {booking.passengerArrivedAt && (
                            <span className="ml-2 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-black uppercase">
                              ✓ Boarded
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Traffic Surcharge Control Panel for Driver */}
                    {ride.status === 'in_progress' && (
                      <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                        <p className="text-[9px] uppercase tracking-wider text-gray-500 font-black">
                          🚦 Traffic Simulation Dashboard
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateTraffic(ride._id, (ride.trafficDelaySeconds || 0) + 120)}
                            className="px-2.5 py-1 bg-yellow-500/15 border border-yellow-500/25 text-yellow-400 hover:bg-yellow-500/25 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer"
                          >
                            +2m Traffic Delay (+₹5)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateTraffic(ride._id, (ride.trafficDelaySeconds || 0) + 600)}
                            className="px-2.5 py-1 bg-red-500/15 border border-red-500/25 text-red-400 hover:bg-red-500/25 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer"
                          >
                            +10m Traffic Delay (+₹25)
                          </button>
                          {ride.trafficDelaySeconds > 0 && (
                            <button
                              type="button"
                              onClick={() => handleUpdateTraffic(ride._id, 0)}
                              className="px-2.5 py-1 bg-gray-500/15 border border-white/10 text-gray-300 hover:bg-white/10 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer"
                            >
                              Clear Traffic (₹0)
                            </button>
                          )}
                        </div>
                        {ride.trafficDelaySeconds > 0 && (
                          <p className="text-[10px] text-red-400 font-bold">
                            Current delay: {Math.round(ride.trafficDelaySeconds / 60)}m. Current surcharge: ₹{ride.trafficCharge || 0}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyRides
