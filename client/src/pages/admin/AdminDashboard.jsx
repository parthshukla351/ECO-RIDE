import { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FaChartLine, FaUsers, FaCar, FaMoneyBillWave,
  FaLeaf, FaShieldAlt, FaExclamationTriangle,
  FaBan, FaCheck, FaSearch, FaEye, FaTrash
} from 'react-icons/fa'
import GlassCard from '../../components/ui/GlassCard'
import StatCard from '../../components/ui/StatCard'
import AnimatedButton from '../../components/ui/AnimatedButton'
import api from '../../services/api'
import toast from 'react-hot-toast'
import safetyService from '../../services/safetyService'
import AgentControlPanel from './AgentControlPanel'

// =====================
// ADMIN LAYOUT
// =====================
const AdminDashboard = () => {
  return (
    <div className="min-h-[80vh] border border-white/5 rounded-3xl overflow-hidden bg-dark-950 flex shadow-2xl">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <Routes>
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="rides" element={<AdminRides />} />
          <Route path="safety" element={<AdminSafety />} />
          <Route path="agents" element={<AgentControlPanel />} />
          <Route path="analytics" element={<AdminAnalytics />} />
        </Routes>
      </div>
    </div>
  )
}

// =====================
// SIDEBAR
// =====================
const AdminSidebar = () => {
  const location = useLocation()
  
  const links = [
    { path: '/admin', label: 'Overview', icon: FaChartLine, exact: true },
    { path: '/admin/users', label: 'Platform Users', icon: FaUsers },
    { path: '/admin/rides', label: 'Shared Rides', icon: FaCar },
    { path: '/admin/safety', label: 'Safety & Trust', icon: FaShieldAlt },
    { path: '/admin/agents', label: 'AI Agents Control', icon: FaShieldAlt },
    { path: '/admin/analytics', label: 'Carbon Metrics', icon: FaLeaf }
  ]

  return (
    <div className="w-64 bg-dark-900/60 backdrop-blur-md border-r border-white/5 hidden lg:flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <h2 className="text-lg font-black text-white font-display">
          <span className="text-primary-500">EcoRide</span> Admin
        </h2>
        <span className="text-gray-500 text-[10px] font-black uppercase tracking-wider block mt-0.5">Management Console</span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1.5">
          {links.map(link => {
            const isActive = link.exact 
              ? location.pathname === link.path 
              : location.pathname.startsWith(link.path)
            
            return (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-black uppercase tracking-wider border ${
                    isActive
                      ? 'bg-primary-500/10 text-primary-400 border-primary-500/20 shadow-sm'
                      : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
                  }`}
                >
                  <link.icon className="text-sm" />
                  <span>{link.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <Link to="/">
          <AnimatedButton variant="secondary" fullWidth className="text-[10px] uppercase font-black tracking-wider py-2.5">
            ← Back to App
          </AnimatedButton>
        </Link>
      </div>
    </div>
  )
}

// =====================
// OVERVIEW PAGE
// =====================
const AdminOverview = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/stats')
      setStats(data.stats)
    } catch (error) {
      toast.error('Failed to load admin stats')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.users?.total || 0,
      subtitle: `${stats?.users?.newThisMonth || 0} registered this month`,
      icon: FaUsers,
      variant: 'cyan'
    },
    {
      title: 'Total Drivers',
      value: stats?.users?.drivers || 0,
      subtitle: `${stats?.users?.passengers || 0} passengers active`,
      icon: FaCar,
      variant: 'green'
    },
    {
      title: 'Active Rides',
      value: stats?.rides?.total || 0,
      subtitle: `${stats?.rides?.active || 0} currently active now`,
      icon: FaChartLine,
      variant: 'purple'
    },
    {
      title: 'Platform Revenue',
      value: `₹${(stats?.revenue || 0).toLocaleString()}`,
      subtitle: 'All-time transaction value',
      icon: FaMoneyBillWave,
      variant: 'yellow'
    }
  ]

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black font-display text-white tracking-tight">Admin Overview</h1>
        <p className="text-gray-400 text-sm font-medium mt-1">Platform-wide statistics and metrics aggregate.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {statCards.map((card, index) => (
          <StatCard
            key={index}
            title={card.title}
            value={card.value}
            subtext={card.subtitle}
            icon={card.icon}
            variant={card.variant}
            delay={index * 0.05}
          />
        ))}
      </div>

      {/* Quick Navigation Links */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link to="/admin/users">
          <GlassCard className="p-6 border-white/5 bg-dark-900/40 hover:border-primary-500/20">
            <FaUsers className="text-primary-400 text-xl mb-3" />
            <h4 className="text-white font-bold text-sm font-display mb-1">User Directory</h4>
            <p className="text-gray-400 text-xs font-semibold leading-relaxed">Manage user bans, view driver registrations, and verify statuses.</p>
          </GlassCard>
        </Link>

        <Link to="/admin/rides">
          <GlassCard className="p-6 border-white/5 bg-dark-900/40 hover:border-primary-500/20">
            <FaCar className="text-primary-400 text-xl mb-3" />
            <h4 className="text-white font-bold text-sm font-display mb-1">Ride Roster</h4>
            <p className="text-gray-400 text-xs font-semibold leading-relaxed">Oversee scheduled, active, and completed commuter trips.</p>
          </GlassCard>
        </Link>

        <Link to="/admin/analytics">
          <GlassCard className="p-6 border-white/5 bg-dark-900/40 hover:border-primary-500/20">
            <FaLeaf className="text-primary-400 text-xl mb-3" />
            <h4 className="text-white font-bold text-sm font-display mb-1">Environmental Impact</h4>
            <p className="text-gray-400 text-xs font-semibold leading-relaxed">Monitor emissions offset metrics, trees saved, and eco levels.</p>
          </GlassCard>
        </Link>
      </div>
    </div>
  )
}

// =====================
// USERS PAGE
// =====================
const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchUsers()
  }, [page, roleFilter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', page)
      params.append('limit', 15)
      if (roleFilter) params.append('role', roleFilter)
      if (search) params.append('search', search)

      const { data } = await api.get(`/admin/users?${params.toString()}`)
      setUsers(data.users)
      setTotalPages(data.pages)
    } catch (error) {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const handleBanUser = async (userId, userName) => {
    const reason = prompt(`Enter ban reason for ${userName}:`)
    if (reason === null) return

    try {
      const { data } = await api.put(`/admin/users/${userId}/ban`, { reason })
      toast.success(data.message)
      fetchUsers()
    } catch (error) {
      toast.error('Failed to update user status')
    }
  }

  const handleVerifyDriver = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/verify-driver`)
      toast.success('Driver credentials verified successfully')
      fetchUsers()
    } catch (error) {
      toast.error('Failed to verify driver credentials')
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black font-display text-white tracking-tight">Platform Users</h1>
        <p className="text-gray-400 text-sm font-medium mt-1">Audit passenger status and verify driver licenses.</p>
      </div>

      {/* Filters */}
      <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone..."
              className="input-field pl-11 bg-dark-950/80 text-xs"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPage(1)
            }}
            className="input-field w-full md:w-48 bg-dark-950/80 text-xs cursor-pointer py-2.5"
          >
            <option value="">All Account Roles</option>
            <option value="passenger">Passengers</option>
            <option value="driver">Drivers</option>
            <option value="admin">Admins</option>
          </select>
          <AnimatedButton type="submit" variant="primary" className="py-2.5 px-6 text-xs uppercase tracking-wider">
            Search
          </AnimatedButton>
        </form>
      </GlassCard>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-16 space-y-4">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">Querying database users...</p>
        </div>
      ) : (
        <GlassCard hoverable={false} className="overflow-hidden p-0 border-white/5 bg-dark-900/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-dark-950/80 border-b border-white/5 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Verification</th>
                  <th className="px-6 py-4">Completed Rides</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">Offset</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar || 'https://res.cloudinary.com/demo/image/upload/v1/default-avatar.png'}
                          alt={u.name}
                          className="w-9 h-9 rounded-full object-cover border border-white/10"
                        />
                        <div>
                          <p className="text-white font-bold leading-tight">{u.name}</p>
                          <p className="text-gray-500 text-[10px] font-semibold mt-0.5">{u.email}</p>
                          <p className="text-gray-600 text-[10px] font-mono mt-0.5">{u.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black tracking-wider border
                        ${u.role === 'admin' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          u.role === 'driver' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          'bg-green-500/10 text-green-400 border-green-500/20'
                        }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {u.isBanned && (
                          <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] uppercase font-black rounded-full w-fit">
                            Banned
                          </span>
                        )}
                        {u.isVerified ? (
                          <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] uppercase font-black rounded-full w-fit">
                            Verified
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[9px] uppercase font-black rounded-full w-fit">
                            Unverified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white font-semibold">{u.totalRides}</td>
                    <td className="px-6 py-4 text-yellow-400 font-semibold">
                      {u.averageRating?.toFixed(1) || '0.0'} ⭐
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-green-400 font-semibold">{u.totalCO2Saved?.toFixed(1) || 0} kg</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {u.role === 'driver' && !u.isDriverVerified && (
                          <button
                            onClick={() => handleVerifyDriver(u._id)}
                            className="p-2 text-green-400 hover:bg-green-500/10 rounded-xl transition-all cursor-pointer"
                            title="Verify Driver Account"
                          >
                            <FaShieldAlt className="text-sm" />
                          </button>
                        )}
                        <button
                          onClick={() => handleBanUser(u._id, u.name)}
                          className={`p-2 rounded-xl transition-all cursor-pointer ${
                            u.isBanned
                              ? 'text-green-400 hover:bg-green-500/10'
                              : 'text-red-400 hover:bg-red-500/10'
                          }`}
                          title={u.isBanned ? 'Unban User' : 'Ban User'}
                        >
                          <FaBan className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 text-[10px] font-black uppercase tracking-wider text-gray-500 bg-dark-950/20">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <AnimatedButton
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                variant="secondary"
                className="py-1.5 px-3 text-[10px] font-black uppercase"
              >
                Previous
              </AnimatedButton>
              <AnimatedButton
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                variant="secondary"
                className="py-1.5 px-3 text-[10px] font-black uppercase"
              >
                Next
              </AnimatedButton>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}

// =====================
// RIDES PAGE
// =====================
const AdminRides = () => {
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchRides()
  }, [page, statusFilter])

  const fetchRides = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', page)
      params.append('limit', 15)
      if (statusFilter) params.append('status', statusFilter)

      const { data } = await api.get(`/admin/rides?${params.toString()}`)
      setRides(data.rides)
      setTotalPages(data.pages)
    } catch (error) {
      toast.error('Failed to load rides')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRide = async (rideId) => {
    if (!confirm('Are you sure you want to delete this ride?')) return
    try {
      await api.delete(`/admin/rides/${rideId}`)
      toast.success('Ride record deleted')
      fetchRides()
    } catch (error) {
      toast.error('Failed to delete ride')
    }
  }

  const statusColors = {
    scheduled: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    in_progress: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    completed: 'bg-green-500/10 text-green-400 border border-green-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border border-red-500/20'
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black font-display text-white tracking-tight">Active Platforms Rides</h1>
        <p className="text-gray-400 text-sm font-medium mt-1">Supervise and manage published commuter routes.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/5 scrollbar-thin">
        {[
          { value: '', label: 'All Shared Rides' },
          { value: 'scheduled', label: 'Scheduled' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' }
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => {
              setStatusFilter(tab.value)
              setPage(1)
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border
              ${statusFilter === tab.value
                ? 'bg-primary-500/10 text-primary-400 border-primary-500/25'
                : 'bg-dark-900/40 text-gray-400 border-transparent hover:text-white'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Rides Table */}
      {loading ? (
        <div className="text-center py-16 space-y-4">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">Querying shared routes...</p>
        </div>
      ) : (
        <GlassCard hoverable={false} className="overflow-hidden p-0 border-white/5 bg-dark-900/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-dark-950/80 border-b border-white/5 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Route</th>
                  <th className="px-6 py-4">Driver</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Departure</th>
                  <th className="px-6 py-4">Seats Reserved</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">CO₂ saved</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rides.map(ride => (
                  <tr key={ride._id} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-white font-bold leading-tight">
                        {ride.origin?.city} → {ride.destination?.city}
                      </p>
                      <p className="text-gray-500 text-[10px] font-semibold mt-0.5">{ride.distance} km total</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white font-bold">{ride.driver?.name}</p>
                      <p className="text-gray-500 text-[10px] font-semibold mt-0.5">{ride.driver?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-black tracking-wider border ${statusColors[ride.status]}`}>
                        {ride.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-semibold">
                      {new Date(ride.departureTime).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-white font-bold">
                      {ride.totalSeats - ride.availableSeats}/{ride.totalSeats}
                    </td>
                    <td className="px-6 py-4 text-primary-400 font-black">
                      ₹{ride.pricePerSeat}
                    </td>
                    <td className="px-6 py-4 text-green-400 font-semibold">
                      {ride.carbonSaved?.toFixed(1)} kg
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <Link to={`/ride/${ride._id}`}>
                          <button className="p-2 text-primary-400 hover:bg-primary-500/10 rounded-xl transition-all cursor-pointer">
                            <FaEye />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDeleteRide(ride._id)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 text-[10px] font-black uppercase tracking-wider text-gray-500 bg-dark-950/20">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <AnimatedButton
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                variant="secondary"
                className="py-1.5 px-3 text-[10px] font-black"
              >
                Previous
              </AnimatedButton>
              <AnimatedButton
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                variant="secondary"
                className="py-1.5 px-3 text-[10px] font-black"
              >
                Next
              </AnimatedButton>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}

// =====================
// ANALYTICS PAGE
// =====================
const AdminAnalytics = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/stats')
      setStats(data.stats)
    } catch (error) {
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const carbonKg = stats?.carbonSaved || 0
  const treesEquivalent = (carbonKg / 21).toFixed(0)
  const carsOffRoad = (carbonKg / 4600).toFixed(2)
  const flightsAvoided = (carbonKg / 255).toFixed(1)

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black font-display text-white tracking-tight">Environmental Impact Metrics</h1>
        <p className="text-gray-400 text-sm font-medium mt-1">Detailed evaluation of carbon savings across the platform.</p>
      </div>

      {/* Impact Indicators */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 text-center space-y-2">
          <div className="text-3xl">🌍</div>
          <h3 className="text-2xl font-black font-display text-white">{carbonKg.toFixed(1)} kg</h3>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Total CO₂ Saved</p>
        </GlassCard>

        <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 text-center space-y-2">
          <div className="text-3xl">🌳</div>
          <h3 className="text-2xl font-black font-display text-white">{treesEquivalent}</h3>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Trees Planting Equivalent</p>
        </GlassCard>

        <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 text-center space-y-2">
          <div className="text-3xl">🚗</div>
          <h3 className="text-2xl font-black font-display text-white">{carsOffRoad}</h3>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Cars Taken Off Road (Year)</p>
        </GlassCard>

        <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 text-center space-y-2">
          <div className="text-3xl">✈️</div>
          <h3 className="text-2xl font-black font-display text-white">{flightsAvoided}</h3>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Delhi-Mumbai Flights Saved</p>
        </GlassCard>
      </div>

      {/* Platform Health and Metrics */}
      <div className="grid md:grid-cols-2 gap-6">
        <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-6 space-y-6">
          <h3 className="text-white font-bold font-display text-base">Platform Health</h3>
          <div className="space-y-4 text-xs font-semibold">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Ride Completion Ratio</span>
                <span className="text-white font-bold">
                  {stats?.rides?.total > 0 
                    ? ((stats.rides.completed / stats.rides.total) * 100).toFixed(1) 
                    : 0}%
                </span>
              </div>
              <div className="h-2 bg-dark-950 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ 
                    width: `${stats?.rides?.total > 0 
                      ? (stats.rides.completed / stats.rides.total) * 100 
                      : 0}%` 
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Verification Index</span>
                <span className="text-white font-bold">70.0%</span>
              </div>
              <div className="h-2 bg-dark-950 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '70%' }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Driver to Passenger Ratio</span>
                <span className="text-white font-bold">
                  1:{stats?.users?.drivers > 0 
                    ? Math.round(stats.users.passengers / stats.users.drivers) 
                    : 0}
                </span>
              </div>
              <div className="h-2 bg-dark-950 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '40%' }} />
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-6 space-y-4">
          <h3 className="text-white font-bold font-display text-base">Analytical Totals</h3>
          
          <div className="space-y-2.5 text-xs font-semibold">
            <div className="flex justify-between p-3 bg-dark-950/60 border border-white/5 rounded-xl">
              <span className="text-gray-400">Total Database Users</span>
              <span className="text-white font-bold">{stats?.users?.total || 0}</span>
            </div>
            <div className="flex justify-between p-3 bg-dark-950/60 border border-white/5 rounded-xl">
              <span className="text-gray-400">Active Ride Schedules</span>
              <span className="text-white font-bold">{stats?.rides?.active || 0}</span>
            </div>
            <div className="flex justify-between p-3 bg-dark-950/60 border border-white/5 rounded-xl">
              <span className="text-gray-400">Total Monetized Revenue</span>
              <span className="text-green-400 font-bold">₹{(stats?.revenue || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-3 bg-dark-950/60 border border-white/5 rounded-xl">
              <span className="text-gray-400">Monthly User Influx</span>
              <span className="text-primary-400 font-bold">+{stats?.users?.newThisMonth || 0}</span>
            </div>
            <div className="flex justify-between p-3 bg-dark-950/60 border border-white/5 rounded-xl">
              <span className="text-gray-400">Total Reserved Seats</span>
              <span className="text-white font-bold">{stats?.bookings?.total || 0}</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

// =====================
// SAFETY & TRUST CONTROL PANEL
// =====================
const AdminSafety = () => {
  const [incidents, setIncidents] = useState([]);
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [loadingDrivers, setLoadingDrivers] = useState(true);

  useEffect(() => {
    fetchIncidents();
    fetchPendingDrivers();
  }, []);

  const fetchIncidents = async () => {
    try {
      const data = await safetyService.getSOSIncidents();
      setIncidents(data.incidents || []);
    } catch (err) {
      toast.error('Failed to load SOS incidents');
    } finally {
      setLoadingIncidents(false);
    }
  };

  const fetchPendingDrivers = async () => {
    try {
      const { data } = await api.get('/admin/users?role=driver');
      const filtered = (data.users || []).filter(
        (u) => u.driverVerificationStatus === 'PENDING' || u.driverVerificationStatus === 'UNDER_REVIEW'
      );
      setPendingDrivers(filtered);
    } catch (err) {
      toast.error('Failed to load pending driver requests');
    } finally {
      setLoadingDrivers(false);
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await safetyService.resolveSOS(id, { status: 'ACKNOWLEDGED' });
      toast.success('SOS Incident acknowledged');
      fetchIncidents();
    } catch (err) {
      toast.error('Failed to update incident');
    }
  };

  const handleResolve = async (id) => {
    const notes = prompt('Enter resolution notes:');
    if (notes === null) return;
    try {
      await safetyService.resolveSOS(id, { status: 'RESOLVED', notes });
      toast.success('SOS Incident marked RESOLVED');
      fetchIncidents();
    } catch (err) {
      toast.error('Failed to resolve incident');
    }
  };

  const handleVerifyDriver = async (userId, approve = true) => {
    try {
      const status = approve ? 'VERIFIED' : 'REJECTED';
      await safetyService.reviewVerification(userId, { type: 'driver', status });
      toast.success(`Driver verification set to ${status}`);
      fetchPendingDrivers();
    } catch (err) {
      toast.error('Failed to update verification status');
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black font-display text-white tracking-tight flex items-center gap-2">
          <FaShieldAlt className="text-primary-500 animate-pulse" /> Safety & Trust Control Panel
        </h1>
        <p className="text-gray-400 text-xs font-semibold mt-1">Monitor emergency SOS incidents and approve driver credentials.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* SOS Incidents Column */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            🚨 Active SOS Incidents ({incidents.filter(i => i.status !== 'RESOLVED').length})
          </h3>

          {loadingIncidents ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : incidents.length === 0 ? (
            <GlassCard hoverable={false} className="p-8 text-center text-gray-500 text-xs font-semibold border-white/5 bg-dark-900/40">
              No emergency incidents reported.
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {incidents.map((incident) => (
                <GlassCard key={incident._id} hoverable={false} className="border-white/5 bg-dark-900/40 p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white font-bold text-sm">{incident.user?.name}</h4>
                      <p className="text-[10px] text-gray-400 font-semibold">{incident.user?.phone} • {incident.user?.email}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-full border
                      ${incident.status === 'TRIGGERED' 
                        ? 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse'
                        : incident.status === 'ACKNOWLEDGED'
                          ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                          : 'bg-green-500/10 border-green-500/20 text-green-400'
                      }`}
                    >
                      {incident.status}
                    </span>
                  </div>

                  <div className="text-xs text-gray-400 font-semibold space-y-1 bg-dark-950/40 p-3 rounded-xl border border-white/5">
                    <p>Origin: {incident.ride?.origin?.city}</p>
                    <p>Destination: {incident.ride?.destination?.city}</p>
                    <p>Coordinates: {incident.location?.lat?.toFixed(5)}, {incident.location?.lng?.toFixed(5)}</p>
                  </div>

                  {incident.status !== 'RESOLVED' && (
                    <div className="flex gap-2 pt-1">
                      {incident.status === 'TRIGGERED' && (
                        <AnimatedButton onClick={() => handleAcknowledge(incident._id)} variant="secondary" className="text-[10px] py-1.5 px-3 uppercase tracking-wider font-bold">
                          Acknowledge
                        </AnimatedButton>
                      )}
                      <AnimatedButton onClick={() => handleResolve(incident._id)} variant="primary" className="text-[10px] py-1.5 px-3 bg-green-600 hover:bg-green-700 uppercase tracking-wider font-bold text-white">
                        Resolve SOS
                      </AnimatedButton>
                    </div>
                  )}
                </GlassCard>
              ))}
            </div>
          )}
        </div>

        {/* Driver Verification Requests Queue */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            📋 Driver Verification Review Queue ({pendingDrivers.length})
          </h3>

          {loadingDrivers ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : pendingDrivers.length === 0 ? (
            <GlassCard hoverable={false} className="p-8 text-center text-gray-500 text-xs font-semibold border-white/5 bg-dark-900/40">
              No pending driver verifications in review.
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {pendingDrivers.map((driver) => (
                <GlassCard key={driver._id} hoverable={false} className="border-white/5 bg-dark-900/40 p-5 space-y-4">
                  <div>
                    <h4 className="text-white font-bold text-sm">{driver.name}</h4>
                    <p className="text-[10px] text-gray-400 font-semibold">{driver.email} • {driver.phone}</p>
                  </div>

                  <div className="text-xs text-gray-400 font-semibold space-y-1 bg-dark-950/40 p-3 rounded-xl border border-white/5">
                    <p>Submitted license: <span className="text-white font-mono">{driver.driverLicense?.number}</span></p>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <AnimatedButton onClick={() => handleVerifyDriver(driver._id, true)} variant="primary" className="text-[10px] py-1.5 px-3 bg-green-600 hover:bg-green-700 uppercase tracking-wider font-bold text-white">
                      Approve
                    </AnimatedButton>
                    <AnimatedButton onClick={() => handleVerifyDriver(driver._id, false)} variant="secondary" className="text-[10px] py-1.5 px-3 text-red-400 border-red-500/20 bg-red-500/5 uppercase tracking-wider font-bold">
                      Reject
                    </AnimatedButton>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;