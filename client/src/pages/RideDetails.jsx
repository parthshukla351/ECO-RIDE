import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FaMapMarkerAlt, FaClock, FaCar, FaUsers, FaStar,
  FaLeaf, FaShieldAlt, FaCheck, FaTimes, FaPhone,
  FaEnvelope, FaRoute, FaBolt, FaCheckCircle
} from 'react-icons/fa'
import { useAuth } from '../contexts/AuthContext'
import GlassCard from '../components/ui/GlassCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import api from '../services/api'
import toast from 'react-hot-toast'

// Map tracking imports
import MapView from '../components/map/MapView'
import LiveTracking from '../components/map/LiveTracking'
import ActiveRideSafetyCenter from '../components/safety/ActiveRideSafetyCenter'
import SeatSelection from '../components/booking/SeatSelection'

const RideDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, isAuthenticated } = useAuth()
  
  const [ride, setRide] = useState(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [seatsToBook, setSeatsToBook] = useState(1)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [isSafetyOpen, setIsSafetyOpen] = useState(false)

  useEffect(() => {
    fetchRideDetails()
  }, [id])

  const fetchRideDetails = async () => {
    try {
      const searchParamsStr = searchParams.toString()
      const { data } = await api.get(`/rides/${id}?${searchParamsStr}`)
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
      const hasSegment = ride.segmentDistance && ride.segmentDistance !== ride.distance;
      const pickupAddress = searchParams.get('pickupAddress');
      const dropAddress = searchParams.get('dropAddress');
      const originLatVal = searchParams.get('originLat');
      const originLngVal = searchParams.get('originLng');
      const destinationLatVal = searchParams.get('destinationLat');
      const destinationLngVal = searchParams.get('destinationLng');

      await api.post('/bookings', {
        rideId: id,
        seatsBooked: seatsToBook,
        seats: selectedSeats,
        pickupLocation: hasSegment && pickupAddress && originLatVal ? {
          address: pickupAddress,
          coordinates: { lat: parseFloat(originLatVal), lng: parseFloat(originLngVal) }
        } : null,
        dropLocation: hasSegment && dropAddress && destinationLatVal ? {
          address: dropAddress,
          coordinates: { lat: parseFloat(destinationLatVal), lng: parseFloat(destinationLngVal) }
        } : null
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
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!ride) return null

  const isOwnRide = user?._id === ride.driver._id
  const canBook = isAuthenticated && user?.role === 'passenger' && !isOwnRide && ride.availableSeats > 0

  return (
    <div className="space-y-6 pb-12">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-500 hover:text-white transition-colors cursor-pointer"
      >
        ← Back to search
      </button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ride Card */}
          <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black font-display text-white tracking-tight flex items-center gap-3">
                <FaRoute className="text-primary-400 text-sm" />
                {ride.origin.city} → {ride.destination.city}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black tracking-wider border
                ${ride.status === 'scheduled' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  ride.status === 'in_progress' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                  ride.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                  'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                {ride.status}
              </span>
            </div>

            {/* Route itinerary */}
            <div className="space-y-5 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-500/10 border border-green-500/25 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <span className="text-[9px] uppercase tracking-wider text-gray-500">Origin Route</span>
                  <p className="text-white font-semibold text-sm mt-0.5">{ride.origin.address}</p>
                  <p className="text-gray-400 text-xs font-semibold">{ride.origin.city}</p>
                </div>
                <div className="text-right">
                  <p className="text-primary-400 font-bold text-sm">
                    {new Date(ride.departureTime).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="text-gray-500 text-[10px] font-bold mt-0.5">
                    {new Date(ride.departureTime).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Connecting line */}
              <div className="flex items-center gap-4 pl-5">
                <div className="w-[1px] h-10 bg-gradient-to-b from-green-500 to-red-500 opacity-25"></div>
                <span className="text-gray-500 text-xs font-semibold">
                  {ride.distance} km travelled • {ride.duration} mins est. duration
                </span>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <FaMapMarkerAlt className="text-red-500 text-sm" />
                </div>
                <div className="flex-1">
                  <span className="text-[9px] uppercase tracking-wider text-gray-500">Destination Route</span>
                  <p className="text-white font-semibold text-sm mt-0.5">{ride.destination.address}</p>
                  <p className="text-gray-400 text-xs font-semibold">{ride.destination.city}</p>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/5 text-center">
              <div>
                <FaUsers className="text-primary-400 text-lg mx-auto mb-1.5" />
                <p className="text-white font-black font-display text-sm">{ride.availableSeats}</p>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Seats Left</p>
              </div>
              <div>
                <FaCar className="text-primary-400 text-lg mx-auto mb-1.5" />
                <p className="text-white font-black font-display text-sm capitalize">{ride.vehicleType}</p>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Fuel Type</p>
              </div>
              <div>
                <FaLeaf className="text-primary-400 text-lg mx-auto mb-1.5" />
                <p className="text-white font-black font-display text-sm">{ride.carbonSaved?.toFixed(2)} kg</p>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">CO₂ saved</p>
              </div>
              <div>
                <div className="text-primary-400 text-sm font-black mx-auto mb-1">₹</div>
                <p className="text-white font-black font-display text-sm">{ride.pricePerSeat}</p>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Per seat</p>
              </div>
            </div>
          </GlassCard>

          {/* Route Map / Live Tracking */}
          <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-5">
            <h3 className="text-sm font-bold text-white font-display mb-4 flex items-center gap-2 uppercase tracking-wider">
              <FaRoute className="text-primary-400 text-xs" /> Route & Live Intel
            </h3>
            {ride.status === 'in_progress' ? (
              <LiveTracking ride={ride} />
            ) : (
              <div className="h-[300px] w-full rounded-xl overflow-hidden">
                <MapView
                  origin={ride.origin}
                  destination={ride.destination}
                  currentLocation={ride.currentLocation?.lat ? ride.currentLocation : null}
                  height="100%"
                  showRoute={true}
                  interactive={true}
                  routeCoordinates={ride.routeCoordinates}
                />              </div>
            )}
          </GlassCard>

          {/* Driver details */}
          <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40">
            <h3 className="text-lg font-bold text-white font-display mb-4">Driver Profile</h3>
            <div className="flex items-start gap-4">
              <img
                src={ride.driver.avatar || 'https://res.cloudinary.com/demo/image/upload/v1/default-avatar.png'}
                alt={ride.driver.name}
                className="w-16 h-16 rounded-full object-cover border border-white/10"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <h4 className="text-white font-bold text-base leading-none">{ride.driver.name}</h4>
                  <span className="px-1.5 py-0.5 bg-primary-500/10 border border-primary-500/20 text-primary-400 text-[8px] font-black uppercase rounded-full tracking-wider leading-none">
                    {ride.driver.safetyScore || 75} Trust
                  </span>
                </div>
                
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-3 font-semibold">
                  <span className="flex items-center gap-0.5 text-yellow-400">
                    ★ {ride.driver.averageRating?.toFixed(1) || '0.0'}
                  </span>
                  <span>({ride.driver.totalRatings || 0} reviews)</span>
                  <span>•</span>
                  <span>{ride.driver.totalRides || 0} drives completed</span>
                </div>

                <span className="eco-badge text-[9px] uppercase font-black">
                  {ride.driver.ecoLevel} • {ride.driver.totalCO2Saved?.toFixed(1)} kg CO₂ saved
                </span>

                {canBook && (
                  <div className="flex gap-2 mt-4">
                    <a
                      href={`tel:${ride.driver.phone}`}
                      className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs text-white transition-all font-bold"
                    >
                      <FaPhone className="text-primary-400 text-[10px]" /> Call Driver
                    </a>
                    <a
                      href={`mailto:${ride.driver.email}`}
                      className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs text-white transition-all font-bold"
                    >
                      <FaEnvelope className="text-primary-400 text-[10px]" /> Email Driver
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Driver Vehicle Specs */}
            {ride.driver.vehicleDetails && (
              <div className="mt-6 pt-5 border-t border-white/5">
                <h4 className="text-white font-bold text-xs uppercase tracking-wider text-gray-400 mb-3">Vehicle Details</h4>
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <p className="text-gray-500">Make & Model</p>
                    <p className="text-white mt-0.5">{ride.driver.vehicleDetails.make} {ride.driver.vehicleDetails.model}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Vehicle Year</p>
                    <p className="text-white mt-0.5">{ride.driver.vehicleDetails.year || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Color</p>
                    <p className="text-white mt-0.5 capitalize">{ride.driver.vehicleDetails.color || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Registration plate</p>
                    <p className="text-white mt-0.5 font-mono">{ride.driver.vehicleDetails.licensePlate || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Map Card */}
          <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-6">
            <h3 className="text-lg font-bold text-white font-display mb-4 flex items-center gap-2">
              <FaRoute className="text-primary-400" /> Journey Map & Route Progress
            </h3>
            {((user?._id === ride.driver?._id || ride.bookings?.some(b => (b.passenger?._id === user?._id || b.passenger === user?._id) && b.status === 'confirmed')) && (ride.status === 'in_progress' || ride.status === 'active')) ? (
              <LiveTracking ride={ride} />
            ) : (
              <div className="space-y-4">
                <div className="w-full h-[350px] rounded-xl overflow-hidden relative">
                  <MapView
                    origin={ride.origin}
                    destination={ride.destination}
                    height="100%"
                    showRoute={true}
                    interactive={true}
                    routeCoordinates={ride.routeCoordinates}
                    markers={[
                      ...(searchParams.get('originLat') ? [{
                        coordinates: {
                          lat: parseFloat(searchParams.get('originLat')),
                          lng: parseFloat(searchParams.get('originLng'))
                        },
                        label: `Your Pickup Point: ${searchParams.get('pickupAddress') || ''}`,
                        color: 'blue'
                      }] : []),
                      ...(searchParams.get('destinationLat') ? [{
                        coordinates: {
                          lat: parseFloat(searchParams.get('destinationLat')),
                          lng: parseFloat(searchParams.get('destinationLng'))
                        },
                        label: `Your Dropoff Point: ${searchParams.get('dropAddress') || ''}`,
                        color: 'red'
                      }] : [])
                    ]}
                  />                </div>
                {/* Dynamically detected intermediate waypoints */}
                {ride.intermediatePlaces && ride.intermediatePlaces.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Dynamically Detected Route Waypoints</p>
                    <div className="flex flex-wrap gap-2">
                      {ride.intermediatePlaces.map((stop, sIdx) => (
                        <span key={sIdx} className="px-2.5 py-1 bg-white/5 border border-white/5 text-xs text-gray-300 rounded-lg flex items-center gap-1">
                          📍 {stop.name} <span className="text-[10px] text-gray-500">({stop.progress}% progress)</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </GlassCard>

          {/* Ride Preferences */}
          <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40">
            <h3 className="text-lg font-bold text-white font-display mb-4">Ride Preferences</h3>
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
                  className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold uppercase tracking-wider
                    ${ride.preferences?.[pref.key]
                      ? 'bg-green-500/10 border-green-500/20 text-green-400'
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}
                >
                  {ride.preferences?.[pref.key] ? (
                    <FaCheck className="text-[10px]" />
                  ) : (
                    <FaTimes className="text-[10px]" />
                  )}
                  <span>{pref.icon} {pref.label}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Sidebar Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <GlassCard hoverable={false} className="bg-gradient-to-br from-primary-900/10 to-emerald-900/5 border-primary-500/25 shadow-2xl glow-green p-6">
              <div className="text-center mb-6">
                <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-1">
                  {ride.routeOverlap && ride.routeOverlap < 100 ? 'Segment Seat Price' : 'Seat Price'}
                </p>
                <p className="text-4xl font-black text-primary-400 font-display">
                  ₹{ride.passengerPricePerSeat || ride.pricePerSeat}
                </p>
                {ride.routeOverlap && ride.routeOverlap < 100 && (
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    (Standard Full Route: ₹{ride.pricePerSeat})
                  </span>
                )}
                {ride.aiSuggestedPrice && (
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    AI pricing suggestion: ₹{ride.aiSuggestedPrice}
                  </span>
                )}
              </div>

              {ride.routeOverlap && ride.routeOverlap < 100 && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl space-y-1 text-center">
                  <p className="text-green-400 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1">
                    ✓ MATCHED WITH YOUR ROUTE
                  </p>
                  <p className="text-[10px] text-gray-400 leading-normal">
                    Pickup: {searchParams.get('pickupAddress')} <br />
                    Dropoff: {searchParams.get('dropAddress')} <br />
                    Overlap: {ride.routeOverlap}% of driver's route
                  </p>
                </div>
              )}

              {canBook ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Number of Seats</label>
                    <select
                      value={seatsToBook}
                      onChange={(e) => {
                        setSeatsToBook(parseInt(e.target.value))
                        setSelectedSeats([])
                      }}
                      className="input-field bg-dark-950/80 text-xs py-2.5 cursor-pointer"
                    >
                      {Array.from({ length: ride.availableSeats }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>
                          {n} seat{n > 1 ? 's' : ''} - ₹{n * (ride.passengerPricePerSeat || ride.pricePerSeat)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <SeatSelection
                    rideId={ride._id}
                    seatsToBook={seatsToBook}
                    onSeatsSelected={(selected) => setSelectedSeats(selected)}
                  />

                  {selectedSeats.length > 0 && (
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center bg-white/5 py-2 rounded-xl">
                      Selected Seats: <span className="text-primary-400 font-black">{selectedSeats.join(', ')}</span>
                    </div>
                  )}

                  <div className="space-y-2 py-3 border-t border-b border-white/5 text-xs font-semibold text-gray-400">
                    <div className="flex justify-between">
                      <span>Subtotal (Base Share):</span>
                      <span className="text-white">₹{seatsToBook * (ride.passengerPricePerSeat || ride.pricePerSeat)}</span>
                    </div>
                    {ride.segmentFareDetails && (
                      <>
                        <div className="flex justify-between">
                          <span>Platform Fee:</span>
                          <span className="text-white">+₹{ride.segmentFareDetails.platformFee || 15}</span>
                        </div>
                        {ride.segmentFareDetails.discount > 0 && (
                          <div className="flex justify-between text-green-400">
                            <span>Eco-Vehicle Discount:</span>
                            <span>-₹{ride.segmentFareDetails.discount}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>GST (5%):</span>
                          <span className="text-white">+₹{ride.segmentFareDetails.taxes || 0}</span>
                        </div>
                        <div className="border-t border-white/5 my-1.5"></div>
                        <div className="flex justify-between text-gray-300 font-bold">
                          <span>CURRENT PASSENGER SHARE:</span>
                          <span className="text-primary-400 font-black">₹{ride.segmentFareDetails.totalAmount * seatsToBook}</span>
                        </div>
                        <div className="flex justify-between text-gray-300 font-bold">
                          <span>DRIVER EARNING:</span>
                          <span className="text-emerald-400 font-black">₹{ride.segmentFareDetails.driverEarning * seatsToBook}</span>
                        </div>
                        <div className="flex justify-between text-gray-400 font-bold text-[10px]">
                          <span>TOTAL ROUTE COST:</span>
                          <span className="text-cyan-400 font-black">₹{ride.pricePerSeat * ride.totalSeats}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <AnimatedButton
                    onClick={handleBookRide}
                    disabled={booking || selectedSeats.length !== seatsToBook}
                    variant="primary"
                    fullWidth
                    className="py-3.5 text-xs font-black uppercase tracking-wider mt-2"
                  >
                    {booking ? 'Reserving...' : 'Book This Ride 🌱'}
                  </AnimatedButton>

                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-xs font-medium space-y-1">
                    <p className="text-green-400 font-black uppercase tracking-wider flex items-center gap-1">
                      <FaLeaf /> Carbon Impact
                    </p>
                    <p className="text-gray-400 leading-normal">
                      Offset {(ride.carbonSaved / ride.totalSeats * seatsToBook).toFixed(1)} kg of CO₂ and claim welcome eco rewards.
                    </p>
                  </div>
                </div>
              ) : isOwnRide ? (
                <div className="text-center py-4 space-y-3">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">This is your published ride</p>
                  <AnimatedButton
                    onClick={() => navigate('/driver/rides')}
                    variant="secondary"
                    fullWidth
                    className="text-xs font-bold uppercase tracking-wider py-2.5"
                  >
                    Manage Roster
                  </AnimatedButton>
                </div>
              ) : ride.availableSeats === 0 ? (
                <div className="text-center py-4">
                  <p className="text-red-400 text-xs font-black uppercase tracking-wider mb-1">Ride Roster Full</p>
                  <p className="text-gray-500 text-xs">All seats are reserved.</p>
                </div>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <p className="text-xs text-gray-400 font-semibold leading-relaxed">Please sign in to proceed with this booking.</p>
                  <AnimatedButton
                    onClick={() => navigate('/login', { state: { from: `/ride/${id}` } })}
                    variant="primary"
                    fullWidth
                    className="text-xs font-black uppercase tracking-wider py-2.5"
                  >
                    Sign In
                  </AnimatedButton>
                </div>
              )}

              {ride.vehicleType === 'electric' && (
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
                  <FaBolt className="text-[10px] animate-pulse" />
                  <span>Zero Emissions Transit</span>
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Safety Center Floating Action Shield */}
      {(() => {
        const hasConfirmedBooking = ride.bookings?.some(
          b => (b.passenger?._id === user?._id || b.passenger === user?._id) && b.status === 'confirmed'
        );
        const isDriver = user?._id === ride.driver?._id;
        const showSafetyCenter = (hasConfirmedBooking || isDriver) && (ride.status === 'scheduled' || ride.status === 'in_progress');

        if (!showSafetyCenter) return null;

        return (
          <>
            <div className="fixed bottom-6 right-6 z-40">
              <button
                onClick={() => setIsSafetyOpen(true)}
                className="w-14 h-14 bg-primary-600 hover:bg-primary-500 text-white rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer border border-primary-400/25"
                title="Open Safety Center"
              >
                <FaShieldAlt className="text-xl animate-pulse" />
              </button>
            </div>
            <ActiveRideSafetyCenter
              rideId={ride._id}
              bookingId={ride.bookings?.find(b => b.passenger?._id === user?._id || b.passenger === user?._id)?._id}
              isOpen={isSafetyOpen}
              onClose={() => setIsSafetyOpen(false)}
            />
          </>
        );
      })()}
    </div>
  )
}

export default RideDetails
