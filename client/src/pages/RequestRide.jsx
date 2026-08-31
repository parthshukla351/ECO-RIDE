const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaMapMarkerAlt, FaRoute, FaClock, FaMoneyBillWave, FaSpinner, FaCar, FaTimes } from 'react-icons/fa'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import GlassCard from '../components/ui/GlassCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import MapView from '../components/map/MapView'
import LocationSearch from '../components/map/LocationSearch'
import api from '../services/api'
import toast from 'react-hot-toast'

const RequestRide = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { socket } = useSocket()

  const [origin, setOrigin] = useState(null)
  const [destination, setDestination] = useState(null)
  const [routeData, setRouteData] = useState(null)
  const [calculatingRoute, setCalculatingRoute] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [currentRequest, setCurrentRequest] = useState(null)
  const [timeoutTimer, setTimeoutTimer] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(45)

  const activeRequestRef = useRef(null)

  // Listen for socket events when request is pending
  useEffect(() => {
    if (!socket || !requesting) return

    const handleAccepted = (data) => {
      toast.success('🚗 Driver found! Your ride has been accepted.')
      setRequesting(false)
      if (timeoutTimer) clearInterval(timeoutTimer)
      navigate(`/ondemand/tracking/${data.requestId}`)
    };

    socket.on('onDemandRequestAccepted', handleAccepted)

    return () => {
      socket.off('onDemandRequestAccepted', handleAccepted)
    }
  }, [socket, requesting, timeoutTimer, navigate])

  const handleRouteCalculated = (data) => {
    setRouteData(data)
    setCalculatingRoute(false)
  }

  // Calculate costs transparently based on route coordinates
  const calculateFareDetails = () => {
    if (!routeData) return null
    const dist = parseFloat(routeData.distance)
    const baseRatePerKm = 12
    const baseFare = Math.round(dist * baseRatePerKm)
    const platformFee = 15
    const taxable = baseFare + platformFee
    const gst = Math.round(taxable * 0.05)
    const total = taxable + gst

    return {
      baseRatePerKm,
      baseFare,
      platformFee,
      gst,
      total
    }
  }

  const handleRequestRide = async () => {
    if (!origin || !destination || !routeData) {
      toast.error('Please calculate a valid route first')
      return
    }

    setRequesting(true)
    setTimeRemaining(45)
    try {
      const { data } = await api.post('/ondemand/request', {
        origin,
        destination,
        distance: parseFloat(routeData.distance),
        duration: parseInt(routeData.duration),
        routePolyline: routeData.routePolyline,
        routeCoordinates: routeData.routeCoordinates || []
      })

      if (data.success) {
        if (data.driversFound === 0) {
          toast.error('No available drivers found within 10 km.')
          setRequesting(false)
          return
        }

        setCurrentRequest(data.request)
        activeRequestRef.current = data.request

        // Start countdown timer for expiry
        const interval = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(interval)
              handleRequestExpired()
              return 0
            }
            return prev - 1
          })
        }, 1000)
        setTimeoutTimer(interval)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request ride')
      setRequesting(false)
    }
  }

  const handleCancelRequest = async () => {
    if (timeoutTimer) clearInterval(timeoutTimer)
    setRequesting(false)
    
    const reqToCancel = activeRequestRef.current
    if (reqToCancel) {
      try {
        await api.post('/ondemand/cancel', { requestId: reqToCancel._id })
        toast.success('Ride request cancelled')
      } catch (err) {
        console.warn('Cancel request error:', err.message)
      }
    }
    setCurrentRequest(null)
    activeRequestRef.current = null
  }

  const handleRequestExpired = () => {
    setRequesting(false)
    toast.error('Request timed out. No driver accepted your request.')
    setCurrentRequest(null)
    activeRequestRef.current = null
  }

  const fare = calculateFareDetails()

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-500/10 border border-primary-500/25 rounded-2xl flex items-center justify-center text-primary-400">
          <FaCar className="text-lg" />
        </div>
        <div>
          <h1 className="text-2xl font-black font-display text-white tracking-tight">On-Demand Ride</h1>
          <p className="text-gray-400 text-xs font-semibold">Request a driver instantly to your location</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Search Panel */}
        <div className="space-y-6">
          <GlassCard className="border-white/5 bg-dark-900/40 p-5 space-y-5">
            <h2 className="text-base font-black text-white font-display">Route Search</h2>
            
            <LocationSearch
              label="PICKUP POINT"
              placeholder="Enter pickup address..."
              value={origin ? origin.address : ''}
              onSelectLocation={(loc) => {
                setOrigin(loc)
                setRouteData(null)
              }}
            />

            <LocationSearch
              label="DESTINATION POINT"
              placeholder="Enter destination..."
              value={destination ? destination.address : ''}
              onSelectLocation={(loc) => {
                setDestination(loc)
                setRouteData(null)
              }}
            />

            {origin && destination && !routeData && (
              <AnimatedButton
                variant="primary"
                fullWidth
                onClick={() => setCalculatingRoute(true)}
                disabled={calculatingRoute}
              >
                {calculatingRoute ? (
                  <span className="flex items-center gap-2 justify-center">
                    <FaSpinner className="animate-spin" /> Calculating Route...
                  </span>
                ) : (
                  'Calculate Route & Fare'
                )}
              </AnimatedButton>
            )}
          </GlassCard>

          {/* Fare breakdown */}
          {routeData && fare && (
            <GlassCard className="border-white/5 bg-dark-900/40 p-5 space-y-4">
              <h2 className="text-base font-black text-white font-display border-b border-white/5 pb-2">Fare Breakdown</h2>
              
              <div className="space-y-3 text-sm font-semibold">
                <div className="flex justify-between text-gray-400">
                  <span>Base Route Fare ({routeData.distance} km × ₹{fare.baseRatePerKm}/km)</span>
                  <span className="text-white">₹{fare.baseFare}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Platform Fee</span>
                  <span className="text-white">₹{fare.platformFee}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>GST (5%)</span>
                  <span className="text-white">₹{fare.gst}</span>
                </div>
                <div className="border-t border-white/5 pt-3 flex justify-between text-base font-black text-primary-400">
                  <span>Estimated Total</span>
                  <span>₹{fare.total}</span>
                </div>
              </div>

              <p className="text-[10px] text-gray-500 font-bold text-center">
                *Estimated fare is computed dynamically based on the actual road distance.
              </p>

              {!requesting && (
                <AnimatedButton
                  variant="accent"
                  fullWidth
                  onClick={handleRequestRide}
                >
                  Request Ride Now
                </AnimatedButton>
              )}
            </GlassCard>
          )}
        </div>

        {/* Map Panel */}
        <div className="h-[450px] rounded-2xl border border-white/5 overflow-hidden relative bg-dark-900/20">
          <MapView
            origin={origin}
            destination={destination}
            height="100%"
            showRoute={origin && destination}
            interactive={true}
            onRouteCalculated={handleRouteCalculated}
          />

          {/* Requesting Overlay */}
          {requesting && (
            <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-primary-500/10 border border-primary-500/25 rounded-full flex items-center justify-center text-primary-400 text-xl animate-pulse">
                <FaSpinner className="animate-spin text-2xl" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white font-display">Finding available drivers...</h3>
                <p className="text-gray-400 text-xs font-semibold mt-1">
                  Searching eligible drivers within 10 km radius ({timeRemaining}s remaining)
                </p>
              </div>
              <button
                onClick={handleCancelRequest}
                className="btn-secondary border border-red-500/20 text-red-400 hover:bg-red-500/10 px-6 py-2.5 rounded-xl font-bold text-sm cursor-pointer"
              >
                Cancel Request
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RequestRide
