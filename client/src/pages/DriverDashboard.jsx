import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FaCar, FaLeaf, FaMoneyBillWave, FaStar, 
  FaPlus, FaHistory, FaUsers, FaRoute,
  FaChartLine, FaClock
} from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'

const DriverDashboard = () => {
  const { user } = useAuth()
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
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
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
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-black text-white mb-2">
              Driver Dashboard 🚗
            </h1>
            <p className="text-gray-400">Manage your rides and earnings</p>
          </div>
          <Link to="/driver/publish-ride" className="btn-primary flex items-center gap-2">
            <FaPlus /> Publish New Ride
          </Link>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Earnings */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <FaMoneyBillWave className="text-green-400 text-xl" />
              </div>
              <span className="eco-badge text-xs">All Time</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-1">
              ₹{paymentStats?.totalEarnings?.toLocaleString() || 0}
            </h3>
            <p className="text-gray-400 text-sm">Total Earnings</p>
            <div className="mt-2 pt-2 border-t border-green-500/20">
              <p className="text-green-400 text-xs">
                ₹{paymentStats?.monthlyEarnings?.toLocaleString() || 0} this month
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
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <FaCar className="text-blue-400 text-xl" />
              </div>
              <span className="eco-badge text-xs">Rides</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-1">
              {stats?.totalRides || 0}
            </h3>
            <p className="text-gray-400 text-sm">Rides Completed</p>
            <div className="mt-2 pt-2 border-t border-blue-500/20">
              <p className="text-blue-400 text-xs">
                {stats?.totalDistance?.toFixed(0) || 0} km driven
              </p>
            </div>
          </motion.div>

          {/* CO2 Impact */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="card bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <FaLeaf className="text-purple-400 text-xl" />
              </div>
              <span className="eco-badge text-xs">Impact</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-1">
              {stats?.totalCO2Saved?.toFixed(1) || 0} kg
            </h3>
            <p className="text-gray-400 text-sm">CO₂ Saved</p>
            <div className="mt-2 pt-2 border-t border-purple-500/20">
              <p className="text-purple-400 text-xs">
                {user?.ecoPoints || 0} eco points earned
              </p>
            </div>
          </motion.div>

          {/* Rating */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="card bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-500/30"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <FaStar className="text-yellow-400 text-xl" />
              </div>
              <span className="eco-badge text-xs">Rating</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-1">
              {user?.averageRating?.toFixed(1) || '0.0'} ⭐
            </h3>
            <p className="text-gray-400 text-sm">Driver Rating</p>
            <div className="mt-2 pt-2 border-t border-yellow-500/20">
              <p className="text-yellow-400 text-xs">
                {user?.totalRatings || 0} reviews
              </p>
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Rides */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Recent Rides</h2>
                <Link 
                  to="/driver/rides" 
                  className="text-primary-400 hover:text-primary-300 text-sm"
                >
                  View All
                </Link>
              </div>

              {recentRides.length === 0 ? (
                <div className="text-center py-12">
                  <FaCar className="text-gray-600 text-4xl mx-auto mb-3" />
                  <p className="text-gray-400 mb-4">No rides yet</p>
                  <Link to="/driver/publish-ride" className="btn-primary inline-flex items-center gap-2">
                    <FaPlus /> Publish Your First Ride
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentRides.map((ride) => (
                    <Link
                      key={ride._id}
                      to={`/ride/${ride._id}`}
                      className="block p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl border border-gray-700 hover:border-primary-500/50 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium
                            ${ride.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                              ride.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                              ride.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                            {ride.status}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {new Date(ride.departureTime).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="eco-badge">
                          <FaLeaf className="text-xs" />
                          {ride.carbonSaved?.toFixed(2)} kg
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-white font-medium mb-2">
                        <span>{ride.origin?.city}</span>
                        <FaRoute className="text-gray-500 text-sm" />
                        <span>{ride.destination?.city}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">
                          {ride.totalSeats - ride.availableSeats}/{ride.totalSeats} seats booked
                        </span>
                        <span className="text-primary-400 font-semibold">
                          ₹{ride.pricePerSeat} per seat
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            {/* Vehicle Info */}
            <div className="card bg-gradient-to-br from-gray-800 to-gray-900">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
                  <FaCar className="text-primary-400 text-xl" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Your Vehicle</h3>
                  <p className="text-gray-400 text-sm">
                    {user?.vehicleDetails?.make} {user?.vehicleDetails?.model}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white capitalize">
                    {user?.vehicleDetails?.vehicleType || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Seats:</span>
                  <span className="text-white">
                    {user?.vehicleDetails?.seatingCapacity || 4}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">License:</span>
                  <span className={`${user?.driverLicense?.verified ? 'text-green-400' : 'text-yellow-400'}`}>
                    {user?.driverLicense?.verified ? '✓ Verified' : 'Pending'}
                  </span>
                </div>
              </div>
              <Link 
                to="/profile" 
                className="btn-outline w-full mt-4 text-sm"
              >
                Update Vehicle
              </Link>
            </div>

            {/* This Month Stats */}
            <div className="card">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <FaChartLine className="text-primary-400" />
                This Month
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FaMoneyBillWave className="text-green-400" />
                    <span className="text-gray-400 text-sm">Earnings</span>
                  </div>
                  <span className="text-white font-semibold">
                    ₹{paymentStats?.monthlyEarnings?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FaUsers className="text-blue-400" />
                    <span className="text-gray-400 text-sm">Rides</span>
                  </div>
                  <span className="text-white font-semibold">
                    {paymentStats?.monthlyTransactions || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FaChartLine className="text-purple-400" />
                    <span className="text-gray-400 text-sm">Avg/Ride</span>
                  </div>
                  <span className="text-white font-semibold">
                    ₹{Math.round(paymentStats?.averageTransaction || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card bg-primary-900/20 border-primary-500/30">
              <h3 className="text-white font-bold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link 
                  to="/driver/publish-ride"
                  className="flex items-center gap-3 p-3 bg-primary-500/20 hover:bg-primary-500/30 rounded-lg transition-colors"
                >
                  <FaPlus className="text-primary-400" />
                  <span className="text-white text-sm">Publish New Ride</span>
                </Link>
                <Link 
                  to="/driver/rides"
                  className="flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <FaHistory className="text-gray-400" />
                  <span className="text-white text-sm">View All Rides</span>
                </Link>
                <Link 
                  to="/payments/history"
                  className="flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <FaMoneyBillWave className="text-gray-400" />
                  <span className="text-white text-sm">Payment History</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DriverDashboard