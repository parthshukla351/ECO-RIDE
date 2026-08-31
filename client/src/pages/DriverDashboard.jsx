import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FaCar, FaLeaf, FaMoneyBillWave, FaStar, 
  FaPlus, FaHistory, FaUsers, FaRoute,
  FaChartLine, FaClock, FaTimes
} from 'react-icons/fa'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import GlassCard from '../components/ui/GlassCard'
import StatCard from '../components/ui/StatCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import api from '../services/api'
import toast from 'react-hot-toast'
import TrustScoreCircle from '../components/ui/TrustScoreCircle'
import VerificationBadge from '../components/ui/VerificationBadge'

const DriverDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { socket } = useSocket()
  const [activeRequest, setActiveRequest] = useState(null)

  useEffect(() => {
    if (!socket) return

    socket.on('onDemandRequestCreated', (data) => {
      setActiveRequest(data)
      toast.success('🚗 New ride request nearby!')
    })

    socket.on('onDemandRequestClosed', ({ requestId }) => {
      setActiveRequest((prev) => {
        if (prev && prev.requestId === requestId) {
          return null
        }
        return prev
      })
    })

    // Update driver's location periodically
    const sendLocationUpdate = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const loc = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            socket.emit('updateDriverLiveLocation', { location: loc });
            api.post('/ondemand/location', { latitude: loc.lat, longitude: loc.lng });
          },
          (err) => console.warn('Geolocation error:', err.message),
          { enableHighAccuracy: true }
        );
      }
    };

    sendLocationUpdate();
    const interval = setInterval(sendLocationUpdate, 15000);

    return () => {
      socket.off('onDemandRequestCreated')
      socket.off('onDemandRequestClosed')
      clearInterval(interval)
    }
  }, [socket])

  const handleAcceptRequest = async () => {
    if (!activeRequest) return
    try {
      const { data } = await api.post('/ondemand/accept', { requestId: activeRequest.requestId })
      if (data.success) {
        toast.success('Ride request accepted!')
        setActiveRequest(null)
        navigate('/driver/rides')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept request')
      setActiveRequest(null)
    }
  }

  const handleDeclineRequest = async () => {
    if (!activeRequest) return
    try {
      await api.post('/ondemand/decline', { requestId: activeRequest.requestId })
      setActiveRequest(null)
    } catch (err) {
      console.warn('Decline error:', err.message)
      setActiveRequest(null)
    }
  }

  const [stats, setStats] = useState(null)
  const [paymentStats, setPaymentStats] = useState(null)
  const [recentRides, setRecentRides] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, ridesRes, paymentRes] = await Promise.all([
        api.get('/users/eco-stats'),
        api.get('/rides/driver/my-rides?limit=3'),
        api.get('/payments/stats')
      ])
      setStats(statsRes.data.ecoStats)
      setRecentRides(ridesRes.data.rides)
      setPaymentStats(paymentRes.data.stats)
    } catch (error) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-8 pb-12">
        {/* Welcome & New Ride Action */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-black font-display text-white tracking-tight">
            Driver Dashboard 🚗
          </h1>
          <p className="text-gray-400 text-sm font-medium mt-1">Manage your shared rides, analytics, and driver profile.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/ai-assistant">
            <AnimatedButton variant="secondary" className="text-xs uppercase tracking-wider font-bold border-white/5 bg-white/5 hover:bg-white/10 text-white">
              ✨ Ask Eco
            </AnimatedButton>
          </Link>
          <Link to="/driver/insights">
            <AnimatedButton variant="secondary" className="text-xs uppercase tracking-wider font-bold border-white/5 bg-white/5 hover:bg-white/10 text-white">
              📊 Insights
            </AnimatedButton>
          </Link>
          <Link to="/driver/publish-ride">
            <AnimatedButton variant="primary" className="text-xs uppercase tracking-wider font-bold">
              <FaPlus className="text-[10px]" /> Publish New Ride
            </AnimatedButton>
          </Link>
        </div>
      </motion.div>

      {/* Driver Statistics Panel */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Earnings"
          value={`₹${paymentStats?.totalEarnings?.toLocaleString() || 0}`}
          subtext={`₹${paymentStats?.monthlyEarnings?.toLocaleString() || 0} this month`}
          icon={FaMoneyBillWave}
          variant="green"
          delay={0.1}
        />

        <StatCard 
          title="Completed Rides"
          value={`${stats?.totalRides || 0}`}
          subtext={`${stats?.totalDistance?.toFixed(0) || 0} km driven total`}
          icon={FaCar}
          variant="cyan"
          delay={0.2}
        />

        <StatCard 
          title="CO₂ Impact"
          value={`${stats?.totalCO2Saved?.toFixed(1) || 0} kg`}
          subtext={`${user?.ecoPoints || 0} eco points earned`}
          icon={FaLeaf}
          variant="purple"
          delay={0.3}
        />

        <StatCard 
          title="Driver Rating"
          value={`${user?.averageRating?.toFixed(1) || '0.0'} ⭐`}
          subtext={`${user?.totalRatings || 0} reviews received`}
          icon={FaStar}
          variant="yellow"
          delay={0.4}
        />
      </div>

      {/* Main Grid Section */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Rides list */}
        <div className="lg:col-span-2">
          <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white font-display">Recent Rides</h3>
              <Link 
                to="/driver/rides" 
                className="text-xs text-primary-400 hover:text-primary-300 font-bold flex items-center gap-1 transition-colors uppercase tracking-wider"
              >
                View All <FaHistory className="text-[10px]" />
              </Link>
            </div>

            {recentRides.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <FaCar className="text-gray-600 text-4xl mx-auto opacity-40" />
                <p className="text-gray-400 text-sm">No shared rides published yet</p>
                <Link to="/driver/publish-ride">
                  <AnimatedButton variant="primary" className="text-xs uppercase tracking-wider">
                    Publish First Ride
                  </AnimatedButton>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentRides.map((ride) => (
                  <Link
                    key={ride._id}
                    to={`/ride/${ride._id}`}
                    className="block p-4 rounded-xl border border-white/5 bg-dark-950/50 hover:bg-dark-950/90 hover:border-primary-500/20 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-black tracking-wider
                          ${ride.status === 'scheduled' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            ride.status === 'in_progress' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                            ride.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                          {ride.status}
                        </span>
                        <span className="text-gray-500 text-[10px] font-bold">
                          {new Date(ride.departureTime).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="eco-badge">
                        <FaLeaf className="text-[10px]" />
                        {ride.carbonSaved?.toFixed(2)} kg Saved
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-white font-semibold mb-2.5">
                      <span>{ride.origin?.city}</span>
                      <FaRoute className="text-gray-500 text-xs" />
                      <span>{ride.destination?.city}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-medium">
                        {ride.totalSeats - ride.availableSeats}/{ride.totalSeats} seats reserved
                      </span>
                      <span className="text-primary-400 font-bold">
                        ₹{ride.pricePerSeat} / seat
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right Column: Vehicle Details and Monthly Stats */}
        <div className="space-y-4">
          {/* Trust Score Card */}
          <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 text-center p-6">
            <h3 className="text-white font-bold text-sm font-display mb-3">Driver Security & Trust</h3>
            <TrustScoreCircle score={user?.safetyScore || 75} size={110} />
            <div className="mt-3 flex justify-center">
              <VerificationBadge status={user?.isVerified ? 'verified' : 'unverified'} />
            </div>
          </GlassCard>

          {/* KYC Pending Banner */}
          {!user?.isVerified && (
            <GlassCard hoverable={false} className="bg-yellow-500/5 border-yellow-500/25 p-5 space-y-3">
              <h4 className="text-yellow-400 font-black text-xs uppercase tracking-wider">Driver KYC Incomplete</h4>
              <p className="text-gray-400 text-[10px] leading-normal font-semibold">Please complete your driver registration documents upload to verify routes, passenger visibility, and trust levels.</p>
              <Link to="/onboarding" className="block">
                <AnimatedButton variant="primary" className="w-full py-2 text-[10px] uppercase font-black tracking-wider">
                  Complete Verification
                </AnimatedButton>
              </Link>
            </GlassCard>
          )}

          {/* Vehicle Info */}
          <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-xl flex items-center justify-center text-lg shadow-inner">
                <FaCar />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm font-display">Active Vehicle</h4>
                <p className="text-gray-400 text-xs mt-0.5">
                  {user?.vehicleDetails?.make || 'No Make'} {user?.vehicleDetails?.model || 'No Model'}
                </p>
              </div>
            </div>
            
            <div className="space-y-2.5 text-xs pt-2 border-t border-white/5">
              <div className="flex justify-between font-medium">
                <span className="text-gray-500">Fuel Type / Vehicle:</span>
                <span className="text-white capitalize">{user?.vehicleDetails?.vehicleType || 'Not set'}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-gray-500">Seating Capacity:</span>
                <span className="text-white">{user?.vehicleDetails?.seatingCapacity || 4} seats</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-gray-500">License Status:</span>
                <span className={`font-bold ${user?.driverLicense?.verified ? 'text-green-400' : 'text-yellow-400'}`}>
                  {user?.driverLicense?.verified ? '✓ Verified' : 'Awaiting Review'}
                </span>
              </div>
            </div>

            <Link to="/profile" className="block mt-4">
              <AnimatedButton variant="secondary" fullWidth className="text-xs uppercase tracking-wider py-2.5">
                Update Vehicle Details
              </AnimatedButton>
            </Link>
          </GlassCard>

          {/* Month Analytics */}
          <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40">
            <h4 className="text-white font-bold text-sm font-display mb-4 flex items-center gap-2">
              <FaChartLine className="text-primary-400 text-xs" />
              Monthly Summary
            </h4>
            
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 bg-dark-950/50 border border-white/5 rounded-xl text-xs">
                <div className="flex items-center gap-2">
                  <FaMoneyBillWave className="text-green-400" />
                  <span className="text-gray-400 font-medium">Monthly Earnings</span>
                </div>
                <span className="text-white font-bold">
                  ₹{paymentStats?.monthlyEarnings?.toLocaleString() || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-dark-950/50 border border-white/5 rounded-xl text-xs">
                <div className="flex items-center gap-2">
                  <FaUsers className="text-blue-400" />
                  <span className="text-gray-400 font-medium">Booked Seats</span>
                </div>
                <span className="text-white font-bold">
                  {paymentStats?.monthlyTransactions || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-dark-950/50 border border-white/5 rounded-xl text-xs">
                <div className="flex items-center gap-2">
                  <FaChartLine className="text-purple-400" />
                  <span className="text-gray-400 font-medium">Average/Order</span>
                </div>
                <span className="text-white font-bold">
                  ₹{Math.round(paymentStats?.averageTransaction || 0)}
                </span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* On-Demand Ride Request Card Overlay */}
      {activeRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard className="max-w-md w-full border-primary-500/30 bg-dark-950/90 p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-base font-black text-white font-display flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-pulse"></span>
                NEW RIDE REQUEST
              </h3>
              <button 
                onClick={() => setActiveRequest(null)}
                className="text-gray-400 hover:text-white text-sm cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4 text-sm font-semibold">
              <div>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Passenger</span>
                <span className="text-white text-base">{activeRequest.riderName}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Pickup</span>
                  <span className="text-white">{activeRequest.origin.city}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Destination</span>
                  <span className="text-white">{activeRequest.destination.city}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center bg-white/5 p-3 rounded-lg border border-white/5">
                <div>
                  <span className="text-[9px] text-gray-500 uppercase block">Distance</span>
                  <span className="text-white font-bold">{activeRequest.distance} km</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-500 uppercase block">Fare</span>
                  <span className="text-primary-400 font-bold">₹{activeRequest.estimatedTotal}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-500 uppercase block">Radius Away</span>
                  <span className="text-white font-bold">{activeRequest.distanceToRider} km</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                onClick={handleDeclineRequest}
                className="flex-1 btn-secondary border border-red-500/20 text-red-400 hover:bg-red-500/10 py-3 rounded-xl font-bold text-sm cursor-pointer"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptRequest}
                className="flex-1 bg-primary-500 text-black hover:bg-primary-400 py-3 rounded-xl font-bold text-sm cursor-pointer"
              >
                Accept & Go
              </button>
            </div>
          </GlassCard>
        </div>
      )}
      </div>
    </>
  )
}

export default DriverDashboard
