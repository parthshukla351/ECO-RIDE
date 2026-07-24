import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FaSearch, FaLeaf, FaCar, FaHistory, FaStar, 
  FaArrowRight, FaTree, FaRoute, FaTrophy 
} from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'

const PassengerDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        api.get('/users/eco-stats'),
        api.get('/bookings/my-bookings?limit=3')
      ])
      setStats(statsRes.data.ecoStats)
      setRecentBookings(bookingsRes.data.bookings)
    } catch (error) {
      console.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const ecoLevelColors = {
    Seedling: 'from-green-400 to-emerald-300',
    Sprout: 'from-emerald-400 to-teal-300',
    Tree: 'from-teal-400 to-cyan-300',
    Forest: 'from-cyan-400 to-blue-300',
    EcoHero: 'from-blue-400 to-purple-300'
  }

  const getNextLevelPoints = (level) => {
    const levels = {
      Seedling: 500,
      Sprout: 1000,
      Tree: 2000,
      Forest: 5000,
      EcoHero: 10000
    }
    return levels[level] || 500
  }

  const getEcoLevelIndex = (level) => {
    const levels = ['Seedling', 'Sprout', 'Tree', 'Forest', 'EcoHero']
    return levels.indexOf(level) + 1
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-black text-white mb-2">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-400">Your eco-friendly journey continues</p>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link
            to="/search"
            className="card hover:border-primary-500 group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary-500/20 rounded-xl flex items-center justify-center group-hover:bg-primary-500/30 transition-colors">
                <FaSearch className="text-primary-400 text-xl" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Find a Ride</h3>
                <p className="text-gray-400 text-sm">Search eco-friendly rides</p>
              </div>
            </div>
          </Link>

          <Link
            to="/bookings"
            className="card hover:border-primary-500 group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                <FaHistory className="text-blue-400 text-xl" />
              </div>
              <div>
                <h3 className="text-white font-semibold">My Bookings</h3>
                <p className="text-gray-400 text-sm">View your ride history</p>
              </div>
            </div>
          </Link>

          <Link
            to="/profile"
            className="card hover:border-primary-500 group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                <FaTrophy className="text-purple-400 text-xl" />
              </div>
              <div>
                <h3 className="text-white font-semibold">My Profile</h3>
                <p className="text-gray-400 text-sm">Manage your account</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              {/* CO2 Saved */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <FaLeaf className="text-green-400 text-xl" />
                  </div>
                  <span className="eco-badge">Impact</span>
                </div>
                <h3 className="text-3xl font-black text-white mb-1">
                  {stats?.totalCO2Saved?.toFixed(1) || 0} kg
                </h3>
                <p className="text-gray-400 text-sm">CO₂ Emissions Saved</p>
                <div className="mt-3 pt-3 border-t border-green-500/20">
                  <p className="text-green-400 text-xs flex items-center gap-1">
                    <FaTree className="text-sm" />
                    {stats?.treesEquivalent || 0} trees equivalent
                  </p>
                </div>
              </motion.div>

              {/* Total Rides */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="card bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <FaCar className="text-blue-400 text-xl" />
                  </div>
                  <span className="eco-badge">Total</span>
                </div>
                <h3 className="text-3xl font-black text-white mb-1">
                  {stats?.totalRides || 0}
                </h3>
                <p className="text-gray-400 text-sm">Rides Completed</p>
                <div className="mt-3 pt-3 border-t border-blue-500/20">
                  <p className="text-blue-400 text-xs flex items-center gap-1">
                    <FaRoute className="text-sm" />
                    {stats?.totalDistance?.toFixed(0) || 0} km travelled
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Recent Bookings */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Recent Bookings</h2>
                <Link 
                  to="/bookings" 
                  className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1"
                >
                  View All <FaArrowRight className="text-xs" />
                </Link>
              </div>

              {recentBookings.length === 0 ? (
                <div className="text-center py-12">
                  <FaCar className="text-gray-600 text-4xl mx-auto mb-3" />
                  <p className="text-gray-400">No bookings yet</p>
                  <Link to="/search" className="btn-primary mt-4 inline-flex items-center gap-2">
                    <FaSearch /> Find Your First Ride
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentBookings.map((booking) => (
                    <Link
                      key={booking._id}
                      to={`/bookings`}
                      className="block p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl border border-gray-700 hover:border-primary-500/50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium
                              ${booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                                booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-blue-500/20 text-blue-400'
                              }`}>
                              {booking.status}
                            </span>
                            <span className="text-gray-500 text-xs">
                              {new Date(booking.ride?.departureTime).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-white font-medium">
                            {booking.ride?.origin?.city} → {booking.ride?.destination?.city}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="eco-badge mb-2">
                            <FaLeaf className="text-xs" />
                            {booking.carbonSaved?.toFixed(2)} kg CO₂
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Eco Level */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card bg-gradient-to-br from-gray-800 to-gray-900 border-primary-500/30"
            >
              <div className="text-center">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${ecoLevelColors[user?.ecoLevel || 'Seedling']} mx-auto mb-4 flex items-center justify-center glow-green shadow-xl`}>
                  <FaLeaf className="text-white text-2xl" />
                </div>
                <h3 className="text-2xl font-black text-white mb-1">
                  {user?.ecoLevel || 'Seedling'}
                </h3>
                <p className="text-gray-400 text-sm mb-4">Current Eco Status</p>
                
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>{user?.ecoPoints || 0} pts</span>
                    <span>Next: {getNextLevelPoints(user?.ecoLevel)}</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary-500 to-emerald-400"
                      style={{ 
                        width: `${Math.min(100, ((user?.ecoPoints || 0) / getNextLevelPoints(user?.ecoLevel)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <div className="flex justify-center gap-2">
                    {['🌱', '🌿', '🌳', '🌲', '🏆'].map((emoji, i) => (
                      <div
                        key={i}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl
                          ${i < getEcoLevelIndex(user?.ecoLevel) 
                            ? 'bg-primary-500/20 border border-primary-500/50' 
                            : 'bg-gray-800 border border-gray-700 opacity-30'
                          }`}
                      >
                        {emoji}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Referral Card */}
            <div className="card bg-gradient-to-br from-primary-900/20 to-emerald-900/20 border-primary-500/30">
              <h3 className="text-white font-bold mb-3">Invite Friends 🎁</h3>
              <p className="text-gray-400 text-sm mb-4">
                Share your code and get 200 bonus points!
              </p>
              <div className="bg-gray-800 rounded-lg p-3 mb-3 flex items-center justify-between">
                <code className="text-primary-400 font-mono text-sm">
                  {user?.referralCode || 'ECO-RIDE'}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(user?.referralCode)
                    toast.success('Code copied!')
                  }}
                  className="text-xs text-primary-400 hover:text-primary-300"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PassengerDashboard;