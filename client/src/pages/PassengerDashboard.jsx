import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FaSearch, FaLeaf, FaCar, FaHistory, FaStar, 
  FaArrowRight, FaTree, FaRoute, FaTrophy, FaWallet 
} from 'react-icons/fa'
import { useAuth } from '../contexts/AuthContext'
import GlassCard from '../components/ui/GlassCard'
import StatCard from '../components/ui/StatCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import api from '../services/api'
import toast from 'react-hot-toast'
import TrustScoreCircle from '../components/ui/TrustScoreCircle'
import VerificationBadge from '../components/ui/VerificationBadge'

const PassengerDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [chartData, setChartData] = useState([])
  const [recentBookings, setRecentBookings] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [summaryRes, bookingsRes, recRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/bookings/my-bookings?limit=3'),
        api.get('/rides/personalized/recommendations')
      ])
      setStats(summaryRes.data.summary)
      setChartData(summaryRes.data.chartData?.rideActivity || [])
      setRecentBookings(bookingsRes.data.bookings)
      setRecommendations(recRes.data.recommendations)
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
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Heading */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-black font-display text-white tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-400 text-sm font-medium mt-1">Your eco-friendly journey continues.</p>
        </div>

        <div className="flex gap-2">
          <Link to="/ai-assistant">
            <AnimatedButton variant="secondary" className="text-xs uppercase tracking-wider font-bold border-white/5 bg-white/5 hover:bg-white/10 text-white">
              ✨ Ask Eco
            </AnimatedButton>
          </Link>
          <Link to="/search">
            <AnimatedButton variant="primary" className="text-xs uppercase tracking-wider font-bold">
              <FaSearch className="text-[10px]" /> Find a Ride
            </AnimatedButton>
          </Link>
        </div>
      </motion.div>

      {/* Premium AI Suggestion Box */}
      <GlassCard hoverable={false} className="border-white/5 bg-gradient-to-r from-primary-950/15 to-emerald-950/5 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <span className="text-[9px] font-black uppercase text-primary-400 tracking-wider">✨ AI Commute Suggestion</span>
          <h4 className="text-white font-bold text-sm">Optimal Departure Window Reached</h4>
          <p className="text-gray-400 text-xs font-semibold leading-relaxed">
            Your typical Lucknow route shows 12% lower predicted traffic congestion around 8:15 AM compared to 8:00 AM.
          </p>
        </div>
        <Link to="/search">
          <AnimatedButton variant="primary" className="text-[10px] uppercase font-bold tracking-wider py-2 px-4 whitespace-nowrap">
            Explore Scheduled Rides
          </AnimatedButton>
        </Link>
      </GlassCard>

      {/* Quick Action Navigation Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/search">
          <GlassCard className="p-5 border-white/5 bg-dark-900/40 hover:border-primary-500/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-xl flex items-center justify-center text-lg">
                <FaSearch />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">Find Commute</h4>
                <p className="text-gray-400 text-xs mt-0.5">Explore scheduled routes</p>
              </div>
            </div>
          </GlassCard>
        </Link>

        <Link to="/bookings">
          <GlassCard className="p-5 border-white/5 bg-dark-900/40 hover:border-primary-500/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl flex items-center justify-center text-lg">
                <FaHistory />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">My Bookings</h4>
                <p className="text-gray-400 text-xs mt-0.5">Track your reservations</p>
              </div>
            </div>
          </GlassCard>
        </Link>

        <Link to="/wallet">
          <GlassCard className="p-5 border-white/5 bg-dark-900/40 hover:border-primary-500/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center justify-center text-lg">
                <FaWallet />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">My Wallet</h4>
                <p className="text-gray-400 text-xs mt-0.5">Load funds & pay rides</p>
              </div>
            </div>
          </GlassCard>
        </Link>

        <Link to="/profile">
          <GlassCard className="p-5 border-white/5 bg-dark-900/40 hover:border-primary-500/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl flex items-center justify-center text-lg">
                <FaTrophy />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">Eco Profile</h4>
                <p className="text-gray-400 text-xs mt-0.5">Manage details & vehicle</p>
              </div>
            </div>
          </GlassCard>
        </Link>
      </div>

      {/* AI Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              ✨ Recommended Rides For You
            </h3>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">
              AI Powered Match
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendations.map((ride) => (
              <Link key={ride._id} to={`/ride/${ride._id}`} className="block h-full">
                <GlassCard hoverable={true} className="p-5 border-white/5 bg-dark-900/40 hover:border-primary-500/20 h-full flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-black uppercase tracking-wider text-primary-400 bg-primary-500/10 border border-primary-500/20 px-2 py-0.5 rounded-full">
                        ✨ {ride.matchScore}% Match
                      </span>
                      <span className="text-white font-black text-xs font-display">₹{ride.pricePerSeat}</span>
                    </div>

                    <div>
                      <p className="text-white font-bold text-xs">{ride.origin?.city} → {ride.destination?.city}</p>
                      <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">
                        Leaves: {new Date(ride.departureTime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={ride.driver?.avatar || 'https://res.cloudinary.com/demo/image/upload/v1/default-avatar.png'}
                        alt={ride.driver?.name}
                        className="w-5 h-5 rounded-full object-cover border border-white/10"
                      />
                      <span className="text-gray-400 text-[10px] font-bold">{ride.driver?.name}</span>
                    </div>

                    {ride.matchReasons && ride.matchReasons[0] && (
                      <p className="text-green-400 text-[9px] font-bold leading-tight">
                        ✓ {ride.matchReasons[0]}
                      </p>
                    )}
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Stats and Bookings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <StatCard 
              title="CO₂ Saved"
              value={`${stats?.co2Saved?.toFixed(1) || 0} kg`}
              subtext={`${Math.round((stats?.co2Saved || 0) / 22)} tree equivalents offset`}
              icon={FaLeaf}
              variant="green"
              delay={0.1}
            />

            <StatCard 
              title="Rides Completed"
              value={`${stats?.completedRides || 0}`}
              subtext={`${stats?.distanceShared?.toFixed(0) || 0} km travelled total`}
              icon={FaCar}
              variant="cyan"
              delay={0.2}
            />
          </div>

          {/* Reusable responsive SVG line chart builder */}
          {chartData.length > 0 && (
            <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-5 space-y-4">
              <h3 className="text-white font-bold font-display text-sm">Monthly Commutes Trend</h3>
              <div className="pt-2">
                {(() => {
                  const width = 500;
                  const height = 120;
                  const padding = 20;
                  const values = chartData.map(d => d.value);
                  const maxValue = Math.max(1, ...values);

                  const points = chartData.map((d, index) => {
                    const x = padding + (index * (width - padding * 2) / (chartData.length - 1));
                    const y = height - padding - (d.value * (height - padding * 2) / maxValue);
                    return { x, y, name: d.name, value: d.value };
                  });

                  const pathD = points.reduce((acc, p, index) => {
                    return index === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                  }, '');

                  const areaD = points.length > 0 
                    ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
                    : '';

                  return (
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {areaD && <path d={areaD} fill="url(#chartGrad)" />}
                      {pathD && <path d={pathD} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />}
                      {points.map((p, idx) => (
                        <g key={idx}>
                          <circle cx={p.x} cy={p.y} r="3" fill="#047857" stroke="#10B981" strokeWidth="1.5" />
                          <text x={p.x} y={height - 2} textAnchor="middle" fill="#9CA3AF" fontSize="8" fontWeight="bold">
                            {p.name}
                          </text>
                        </g>
                      ))}
                    </svg>
                  );
                })()}
              </div>
            </GlassCard>
          )}

          {/* Recent Bookings Box */}
          <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white font-display">Recent Bookings</h3>
              <Link 
                to="/bookings" 
                className="text-xs text-primary-400 hover:text-primary-300 font-bold flex items-center gap-1 transition-colors uppercase tracking-wider"
              >
                View All <FaArrowRight className="text-[10px]" />
              </Link>
            </div>

            {recentBookings.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <FaCar className="text-gray-600 text-4xl mx-auto opacity-40" />
                <p className="text-gray-400 text-sm">No reservations found yet</p>
                <Link to="/search" className="inline-block">
                  <AnimatedButton variant="primary" className="text-xs uppercase tracking-wider">
                    Book First Ride
                  </AnimatedButton>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((booking) => (
                  <Link
                    key={booking._id}
                    to={`/bookings`}
                    className="block p-4 rounded-xl border border-white/5 bg-dark-950/50 hover:bg-dark-950/90 hover:border-primary-500/20 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-black tracking-wider
                            ${booking.status === 'confirmed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                              booking.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                              'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>
                            {booking.status}
                          </span>
                          <span className="text-gray-500 text-[10px] font-bold">
                            {new Date(booking.ride?.departureTime).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-white text-sm font-semibold">
                          {booking.ride?.origin?.city} → {booking.ride?.destination?.city}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="eco-badge">
                          <FaLeaf className="text-[10px]" />
                          {booking.carbonSaved?.toFixed(2)} kg CO₂
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right Column: Eco Badge Status and Referral */}
        <div className="space-y-4">
          {/* Trust Score Card */}
          <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 text-center p-6">
            <h3 className="text-white font-bold text-sm font-display mb-3">Security & Trust</h3>
            <TrustScoreCircle score={user?.safetyScore || 75} size={110} />
            <div className="mt-3 flex justify-center">
              <VerificationBadge status={user?.isVerified ? 'verified' : 'unverified'} />
            </div>
          </GlassCard>

          {/* KYC Pending Banner */}
          {!user?.isVerified && (
            <GlassCard hoverable={false} className="bg-yellow-500/5 border-yellow-500/25 p-5 space-y-3">
              <h4 className="text-yellow-400 font-black text-xs uppercase tracking-wider">KYC Verification Incomplete</h4>
              <p className="text-gray-400 text-[10px] leading-normal font-semibold">Please upload your driving license or identification documents to unlock gold/diamond trust tiers.</p>
              <Link to="/onboarding" className="block">
                <AnimatedButton variant="primary" className="w-full py-2 text-[10px] uppercase font-black tracking-wider">
                  Complete Verification
                </AnimatedButton>
              </Link>
            </GlassCard>
          )}

          <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 text-center">
            <div className="space-y-4 p-5">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${ecoLevelColors[user?.ecoLevel || 'Seedling']} mx-auto flex items-center justify-center glow-green shadow-xl`}>
                <FaLeaf className="text-white text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-black font-display text-white">{user?.ecoLevel || 'Seedling'}</h3>
                <p className="text-gray-500 text-[10px] font-bold uppercase mt-1">Eco Level Status</p>
              </div>

              <div className="pt-2">
                <div className="flex justify-between text-[9px] text-gray-500 mb-1 font-bold uppercase tracking-wider">
                  <span>{user?.ecoPoints || 0} PTS</span>
                  <span>NEXT: {getNextLevelPoints(user?.ecoLevel)} PTS</span>
                </div>
                <div className="h-1.5 bg-dark-950 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-500 to-emerald-400 rounded-full"
                    style={{ 
                      width: `${Math.min(100, ((user?.ecoPoints || 0) / getNextLevelPoints(user?.ecoLevel)) * 100)}%` 
                    }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <div className="flex justify-center gap-2">
                  {['🌱', '🌿', '🌳', '🌲', '🏆'].map((emoji, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all
                        ${i < getEcoLevelIndex(user?.ecoLevel) 
                          ? 'bg-primary-500/10 border border-primary-500/25 shadow-sm' 
                          : 'bg-dark-950 border border-white/5 opacity-20'
                        }`}
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Referral Card */}
          <GlassCard hoverable={false} className="bg-gradient-to-br from-primary-900/10 to-emerald-900/5 border-primary-500/20">
            <h3 className="text-white font-bold text-sm font-display mb-1.5">Invite Companions 🎁</h3>
            <p className="text-gray-400 text-xs leading-relaxed font-medium mb-4">
              Share your personal referral link and receive 200 eco points when they take their first ride!
            </p>
            <div className="bg-dark-950/70 border border-white/5 rounded-xl p-3 flex items-center justify-between">
              <code className="text-primary-400 font-mono text-xs font-black uppercase">
                {user?.referralCode || 'ECO-RIDE'}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(user?.referralCode)
                  toast.success('Referral code copied!')
                }}
                className="text-xs text-primary-400 hover:text-primary-300 font-bold transition-colors cursor-pointer"
              >
                Copy
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

export default PassengerDashboard
