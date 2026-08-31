import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FaMapMarkerAlt, FaCar, FaClock, FaPhone, FaShieldAlt, FaStar, FaCheckCircle } from 'react-icons/fa'
import { useSocket } from '../contexts/SocketContext'
import GlassCard from '../components/ui/GlassCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import MapView from '../components/map/MapView'
import api from '../services/api'
import toast from 'react-hot-toast'

// Haversine helper
const getGeographicDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const OnDemandTracking = () => {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const { socket } = useSocket()

  const [loading, setLoading] = useState(true)
  const [request, setRequest] = useState(null)
  const [driverLocation, setDriverLocation] = useState(null)
  const [eta, setEta] = useState(0)
  const [distanceToPickup, setDistanceToPickup] = useState(0)
  const [statusText, setStatusText] = useState('Finding your driver...')
  const [rideDetails, setRideDetails] = useState(null)

  const [waitingTime, setWaitingTime] = useState(0)
  const [isDriverArrived, setIsDriverArrived] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    fetchRequestDetails()
  }, [requestId])

  // Setup sockets for location telemetry and status changes
  useEffect(() => {
    if (!socket || !request?.rideId) return

    // Join the ride room
    socket.emit('joinRide', request.rideId)

    socket.on('driverLocationUpdate', ({ location }) => {
      setDriverLocation(location)
      calculateMetrics(location)
    })

    socket.on('rideStatusChanged', ({ status }) => {
      fetchRequestDetails()
      if (status === 'completed') {
        toast.success('🎉 You have arrived at your destination!')
        navigate('/bookings')
      }
    })

    socket.on('driverArrived', () => {
      setIsDriverArrived(true)
      toast.success('📍 Driver has arrived at your pickup location!')
    })

    socket.on('fareUpdated', (data) => {
      setRequest(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          estimatedTotal: data.newFare
        };
      });
      if (data.trafficDelay) {
        setRideDetails(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            trafficDelaySeconds: data.trafficDelay,
            trafficCharge: data.trafficCharge
          };
        });
      }
      toast.success('💰 Fare split / surcharge updated.');
    })

    socket.on('lateChargeApplied', (data) => {
      setRequest(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          estimatedTotal: data.newFare,
          passengerLateCharge: data.charge,
          passengerLateMinutes: data.lateMinutes
        };
      });
      toast.error(`⚠️ Waiting charge of ₹${data.charge} applied for being late!`);
    })

    return () => {
      socket.emit('leaveRide', request.rideId)
      socket.off('driverLocationUpdate')
      socket.off('rideStatusChanged')
      socket.off('driverArrived')
      socket.off('fareUpdated')
      socket.off('lateChargeApplied')
    }
  }, [socket, request?.rideId])

  useEffect(() => {
    if (isDriverArrived && !request?.passengerArrivedAt && !rideDetails?.passengerArrivedAt) {
      timerRef.current = setInterval(() => {
        setWaitingTime(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isDriverArrived, request?.passengerArrivedAt, rideDetails?.passengerArrivedAt])

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0')
    const secs = (seconds % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }

  const fetchRequestDetails = async () => {
    try {
      const { data } = await api.get(`/bookings`) // We find the booking matching the ride
      // Find the confirmed booking linked to this ride
      if (request?.rideId) {
        const { data: rideData } = await api.get(`/rides/${request.rideId}`)
        setRideDetails(rideData.ride)
      } else {
        const { data: reqDetails } = await api.get(`/ondemand/nearby`) // helper logic
        // Poll request details
      }
      
      // Let's call a direct endpoint to get this request details
      // We can fetch bookings and find the one for request
      const { data: bData } = await api.get(`/bookings/my-bookings`)
      const match = bData.bookings.find(b => b.ride && (b.ride._id === request?.rideId || b.ride === request?.rideId))
      
      // Let's make an API call to get specific request details
      const { data: reqData } = await api.get(`/bookings`) // search query matching
    } catch (err) {}
    
    // To keep it simple and robust, let's load the request directly
    try {
      // Let's request booking via active bookings
      const { data: bData } = await api.get(`/bookings/my-bookings`)
      // Sort bookings to get the latest one
      if (bData.bookings && bData.bookings.length > 0) {
        const latestBooking = bData.bookings[0];
        setRequest({
          _id: latestBooking._id,
          rider: latestBooking.passenger,
          assignedDriver: latestBooking.driver,
          origin: latestBooking.pickupLocation,
          destination: latestBooking.dropLocation,
          estimatedTotal: latestBooking.totalAmount,
          rideId: latestBooking.ride?._id || latestBooking.ride,
          status: latestBooking.status
        })

        const { data: rData } = await api.get(`/rides/${latestBooking.ride?._id || latestBooking.ride}`)
        setRideDetails(rData.ride)

        if (rData.ride?.currentLocation?.lat) {
          setDriverLocation(rData.ride.currentLocation)
          calculateMetrics(rData.ride.currentLocation, latestBooking.pickupLocation.coordinates, rData.ride.status)
        }
      }
      setLoading(false)
    } catch (err) {
      toast.error('Failed to load tracking details')
      setLoading(false)
    }
  }

  const calculateMetrics = (dLoc, pCoords = null, rideStatus = null) => {
    const pickup = pCoords || request?.origin?.coordinates;
    const rStatus = rideStatus || rideDetails?.status;

    if (!dLoc || !pickup) return

    const dist = getGeographicDistance(dLoc.lat, dLoc.lng, pickup.lat, pickup.lng)
    setDistanceToPickup(dist)
    
    // Average speed 30km/h
    const time = Math.round((dist / 30) * 60)
    setEta(Math.max(1, time))

    if (rStatus === 'in_progress') {
      setStatusText('Active Ride: En route to destination')
    } else {
      if (dist <= 0.2) {
        setStatusText('✓ Driver Has Arrived (reached pickup location)')
      } else if (dist <= 1.0) {
        setStatusText('📍 Driver is nearby (almost at pickup location)')
      } else {
        setStatusText('🚗 Driver is on the way')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <FaSpinner className="animate-spin text-primary-400 text-3xl" />
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Initializing live tracking...</p>
      </div>
    )
  }

  if (!request || !rideDetails) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <FaShieldAlt className="text-4xl text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-white">No active trip found</h3>
        <p className="text-gray-400 text-sm">Please check your bookings history for past rides.</p>
      </div>
    )
  }

  const driver = rideDetails.driver;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-500/10 border border-primary-500/25 rounded-2xl flex items-center justify-center text-primary-400">
          <FaShieldAlt className="text-lg" />
        </div>
        <div>
          <h1 className="text-2xl font-black font-display text-white tracking-tight">Live Trip Tracking</h1>
          <p className="text-gray-400 text-xs font-semibold">Secure real-time vehicle transit telemetry</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Driver Details and Status */}
        <div className="space-y-6">
          <GlassCard className="border-white/5 bg-dark-900/40 p-5 space-y-5">
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Ride Status</span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-full border
                  ${rideDetails.status === 'in_progress' 
                    ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                    : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {rideDetails.status}
                </span>
                <span className="text-white font-bold text-xs">{statusText}</span>
              </div>
            </div>

            {/* Distance / ETA card */}
            {rideDetails.status !== 'completed' && driverLocation && (
              <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                <div>
                  <FaClock className="text-primary-400 text-lg mx-auto mb-1.5" />
                  <p className="text-white font-black text-lg">{eta} min</p>
                  <p className="text-gray-500 text-[10px] font-bold">ESTIMATED ETA</p>
                </div>
                <div>
                  <FaCar className="text-primary-400 text-lg mx-auto mb-1.5" />
                  <p className="text-white font-black text-lg">{distanceToPickup.toFixed(1)} km</p>
                  <p className="text-gray-500 text-[10px] font-bold">DISTANCE AWAY</p>
                </div>
              </div>

            )}

            {/* Waiting Penalty Card */}
            {(isDriverArrived || distanceToPickup <= 0.2) && !request?.passengerArrivedAt && !rideDetails?.passengerArrivedAt && (
              <div className="bg-yellow-500/10 border border-yellow-500/25 p-4 rounded-xl space-y-2 text-xs text-gray-300 font-semibold mt-3">
                <p className="text-yellow-400 font-black flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  📍 Driver Has Arrived
                </p>
                <div className="flex justify-between">
                  <span>Waiting Time:</span>
                  <span className="text-white font-mono">{formatTimer(waitingTime)}</span>
                </div>
                <div className="flex justify-between text-yellow-400">
                  <span>Current waiting charge:</span>
                  <span>₹{Math.floor(waitingTime / 60) * 1} (₹1/min)</span>
                </div>
                <p className="text-[9px] text-gray-500 font-bold leading-normal text-center pt-1">
                  *Surcharge of ₹1 per minute applies if boarding is delayed.
                </p>
              </div>
            )}

            {/* Traffic & Surcharges Section */}
            {rideDetails?.trafficDelaySeconds > 0 && (
              <div className="bg-red-500/10 border border-red-500/25 p-4 rounded-xl space-y-2 text-xs text-gray-300 font-semibold mt-3">
                <p className="text-red-400 font-black flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  🚦 Traffic Detected
                </p>
                <div className="flex justify-between">
                  <span>Traffic Delay Time:</span>
                  <span className="text-white">{Math.round(rideDetails.trafficDelaySeconds / 60)} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Traffic Delay Distance:</span>
                  <span className="text-white">{(rideDetails.trafficDelaySeconds / 500).toFixed(1)} km</span>
                </div>
                <div className="flex justify-between text-red-400">
                  <span>Traffic Surcharge:</span>
                  <span>+₹{rideDetails.trafficCharge || Math.floor(rideDetails.trafficDelaySeconds / 120) * 5}</span>
                </div>
                <div className="border-t border-white/5 my-1 pt-1 flex justify-between font-bold text-primary-400 text-sm">
                  <span>Updated Fare:</span>
                  <span>₹{request.estimatedTotal}</span>
                </div>
              </div>
            )}

            <div className="border-t border-white/5 pt-5 space-y-4">
              <h3 className="text-sm font-black text-white font-display">Your Driver</h3>
              <div className="flex items-center gap-4">
                <img
                  src={driver.avatar || 'https://res.cloudinary.com/demo/image/upload/v1/default-avatar.png'}
                  alt={driver.name}
                  className="w-12 h-12 rounded-full object-cover border border-white/10"
                />
                <div className="flex-1">
                  <h4 className="text-white font-bold text-sm flex items-center gap-1.5">
                    {driver.name}
                    {driver.isDriverVerified && <FaCheckCircle className="text-primary-400 text-xs" />}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><FaStar className="text-yellow-500" /> {driver.averageRating || '5.0'}</span>
                    <span>•</span>
                    <span>{driver.totalRides || 0} rides</span>
                  </div>
                </div>
              </div>

              {/* Vehicle */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-1 text-sm font-semibold">
                <div className="flex justify-between text-gray-400">
                  <span>Vehicle Model</span>
                  <span className="text-white">{driver.vehicleDetails?.make} {driver.vehicleDetails?.model}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>License Plate</span>
                  <span className="text-white uppercase">{driver.vehicleDetails?.licensePlate}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Total Fare</span>
                  <span className="text-primary-400 font-bold">₹{request.estimatedTotal}</span>
                </div>
              </div>

              {/* Call button */}
              <a
                href={`tel:${driver.phone}`}
                className="w-full flex items-center justify-center gap-2 bg-primary-500 text-black py-3 rounded-xl font-bold hover:bg-primary-400 transition-colors text-sm cursor-pointer"
              >
                <FaPhone /> Call Driver
              </a>
            </div>
          </GlassCard>
        </div>

        <div className="lg:col-span-2 h-[450px] rounded-2xl border border-white/5 overflow-hidden bg-dark-900/20">
          <MapView
            origin={request.pickupLocation || request.origin}
            destination={request.dropLocation || request.destination}
            currentLocation={driverLocation}
            height="100%"
            showRoute={true}
            interactive={true}
            trafficDelaySeconds={rideDetails?.trafficDelaySeconds || 0}
          />
        </div>
      </div>
    </div>
  )
}

export default OnDemandTracking
