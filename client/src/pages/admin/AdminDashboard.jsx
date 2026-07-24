import { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FaChartLine, FaUsers, FaCar, FaMoneyBillWave,
  FaLeaf, FaShieldAlt, FaExclamationTriangle,
  FaBan, FaCheck, FaSearch, FaEye, FaTrash
} from 'react-icons/fa'
import api from '../../services/api'
import toast from 'react-hot-toast'

// =====================
// ADMIN LAYOUT
// =====================
const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="rides" element={<AdminRides />} />
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
    { path: '/admin/users', label: 'Users', icon: FaUsers },
    { path: '/admin/rides', label: 'Rides', icon: FaCar },
    { path: '/admin/analytics', label: 'Analytics', icon: FaLeaf }
  ]

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 hidden lg:flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-black text-white">
          <span className="text-primary-400">Admin</span> Panel
        </h2>
        <p className="text-gray-500 text-xs mt-1">EcoRide AI Management</p>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {links.map(link => {
            const isActive = link.exact 
              ? location.pathname === link.path 
              : location.pathname.startsWith(link.path)
            
            return (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <link.icon className="text-lg" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-sm"
        >
          ← Back to App
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
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.users?.total || 0,
      subtitle: `${stats?.users?.newThisMonth || 0} this month`,
      icon: FaUsers,
      color: 'blue',
      gradient: 'from-blue-900/30 to-cyan-900/30',
      border: 'border-blue-500/30'
    },
    {
      title: 'Total Drivers',
      value: stats?.users?.drivers || 0,
      subtitle: `${stats?.users?.passengers || 0} passengers`,
      icon: FaCar,
      color: 'green',
      gradient: 'from-green-900/30 to-emerald-900/30',
      border: 'border-green-500/30'
    },
    {
      title: 'Total Rides',
      value: stats?.rides?.total || 0,
      subtitle: `${stats?.rides?.active || 0} active now`,
      icon: FaChartLine,
      color: 'purple',
      gradient: 'from-purple-900/30 to-pink-900/30',
      border: 'border-purple-500/30'
    },
    {
      title: 'Revenue',
      value: `₹${(stats?.revenue || 0).toLocaleString()}`,
      subtitle: 'Total earned',
      icon: FaMoneyBillWave,
      color: 'yellow',
      gradient: 'from-yellow-900/30 to-orange-900/30',
      border: 'border-yellow-500/30'
    },
    {
      title: 'CO₂ Saved',
      value: `${(stats?.carbonSaved || 0).toFixed(1)} kg`,
      subtitle: `${((stats?.carbonSaved || 0) / 21).toFixed(0)} trees equivalent`,
      icon: FaLeaf,
      color: 'green',
      gradient: 'from-green-900/30 to-teal-900/30',
      border: 'border-green-500/30'
    },
    {
      title: 'Completed Rides',
      value: stats?.rides?.completed || 0,
      subtitle: `${stats?.rides?.thisMonth || 0} this month`,
      icon: FaCheck,
      color: 'cyan',
      gradient: 'from-cyan-900/30 to-blue-900/30',
      border: 'border-cyan-500/30'
    }
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Overview of EcoRide AI platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`card bg-gradient-to-br ${card.gradient} ${card.border}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-${card.color}-500/20 rounded-xl flex items-center justify-center`}>
                <card.icon className={`text-${card.color}-400 text-xl`} />
              </div>
            </div>
            <h3 className="text-3xl font-black text-white mb-1">{card.value}</h3>
            <p className="text-gray-400 text-sm">{card.title}</p>
            <p className="text-gray-500 text-xs mt-1">{card.subtitle}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link
          to="/admin/users"
          className="card hover:border-primary-500/50 group"
        >
          <FaUsers className="text-primary-400 text-2xl mb-3" />
          <h3 className="text-white font-bold mb-1">Manage Users</h3>
          <p className="text-gray-400 text-sm">View, ban, or verify users</p>
        </Link>

        <Link
          to="/admin/rides"
          className="card hover:border-primary-500/50 group"
        >
          <FaCar className="text-primary-400 text-2xl mb-3" />
          <h3 className="text-white font-bold mb-1">Manage Rides</h3>
          <p className="text-gray-400 text-sm">View and manage all rides</p>
        </Link>

        <Link
          to="/admin/analytics"
          className="card hover:border-primary-500/50 group"
        >
          <FaLeaf className="text-primary-400 text-2xl mb-3" />
          <h3 className="text-white font-bold mb-1">Carbon Analytics</h3>
          <p className="text-gray-400 text-sm">View environmental impact</p>
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
      toast.error('Failed to update user')
    }
  }

  const handleVerifyDriver = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/verify-driver`)
      toast.success('Driver verified')
      fetchUsers()
    } catch (error) {
      toast.error('Failed to verify driver')
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">User Management</h1>
        <p className="text-gray-400">Manage all platform users</p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="input-field pl-10"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPage(1)
            }}
            className="input-field w-48"
          >
            <option value="">All Roles</option>
            <option value="passenger">Passengers</option>
            <option value="driver">Drivers</option>
            <option value="admin">Admins</option>
          </select>
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800/50">
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-4">User</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-4">Role</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-4">Status</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-4">Rides</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-4">Rating</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-4">CO₂ Saved</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-10 h-10 rounded-full object-cover border border-gray-700"
                        />
                        <div>
                          <p className="text-white font-medium">{u.name}</p>
                          <p className="text-gray-400 text-sm">{u.email}</p>
                          <p className="text-gray-500 text-xs">{u.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize
                        ${u.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                          u.role === 'driver' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {u.isBanned && (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full w-fit">
                            Banned
                          </span>
                        )}
                        {u.isVerified ? (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full w-fit">
                            Verified
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full w-fit">
                            Unverified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white">{u.totalRides}</td>
                    <td className="px-6 py-4 text-yellow-400">
                      {u.averageRating?.toFixed(1) || '0.0'} ⭐
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-green-400">{u.totalCO2Saved?.toFixed(1) || 0} kg</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {u.role === 'driver' && !u.isDriverVerified && (
                          <button
                            onClick={() => handleVerifyDriver(u._id)}
                            className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                            title="Verify Driver"
                          >
                            <FaShieldAlt />
                          </button>
                        )}
                        <button
                          onClick={() => handleBanUser(u._id, u.name)}
                          className={`p-2 rounded-lg transition-colors ${
                            u.isBanned
                              ? 'text-green-400 hover:bg-green-500/20'
                              : 'text-red-400 hover:bg-red-500/20'
                          }`}
                          title={u.isBanned ? 'Unban' : 'Ban'}
                        >
                          <FaBan />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
            <p className="text-gray-400 text-sm">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="btn-outline text-sm px-3 py-1"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="btn-outline text-sm px-3 py-1"
              >
                Next
              </button>
            </div>
          </div>
        </div>
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
      toast.success('Ride deleted')
      fetchRides()
    } catch (error) {
      toast.error('Failed to delete ride')
    }
  }

  const statusColors = {
    scheduled: 'bg-blue-500/20 text-blue-400',
    in_progress: 'bg-yellow-500/20 text-yellow-400',
    completed: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400'
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">Ride Management</h1>
        <p className="text-gray-400">Monitor all rides on the platform</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { value: '', label: 'All' },
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
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              statusFilter === tab.value
                ? 'bg-primary-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Rides Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800/50">
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-4">Route</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-4">Driver</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-4">Status</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-4">Date</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-4">Seats</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-4">Price</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-4">CO₂</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {rides.map(ride => (
                  <tr key={ride._id} className="hover:bg-gray-800/30">
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">
                        {ride.origin?.city} → {ride.destination?.city}
                      </p>
                      <p className="text-gray-500 text-xs">{ride.distance} km</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white text-sm">{ride.driver?.name}</p>
                      <p className="text-gray-500 text-xs">{ride.driver?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[ride.status]}`}>
                        {ride.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {new Date(ride.departureTime).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-white">
                      {ride.totalSeats - ride.availableSeats}/{ride.totalSeats}
                    </td>
                    <td className="px-6 py-4 text-primary-400 font-semibold">
                      ₹{ride.pricePerSeat}
                    </td>
                    <td className="px-6 py-4 text-green-400 text-sm">
                      {ride.carbonSaved?.toFixed(2)} kg
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link
                          to={`/ride/${ride._id}`}
                          className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg"
                          title="View"
                        >
                          <FaEye />
                        </Link>
                        <button
                          onClick={() => handleDeleteRide(ride._id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                          title="Delete"
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
            <p className="text-gray-400 text-sm">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="btn-outline text-sm px-3 py-1"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="btn-outline text-sm px-3 py-1"
              >
                Next
              </button>
            </div>
          </div>
        </div>
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
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const carbonKg = stats?.carbonSaved || 0
  const treesEquivalent = (carbonKg / 21).toFixed(0)
  const carsOffRoad = (carbonKg / 4600).toFixed(2)
  const flightsAvoided = (carbonKg / 255).toFixed(1)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">
          🌱 Carbon Analytics Dashboard
        </h1>
        <p className="text-gray-400">Environmental impact of EcoRide AI</p>
      </div>

      {/* Impact Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30 text-center">
          <div className="text-4xl mb-3">🌍</div>
          <h3 className="text-3xl font-black text-white mb-1">{carbonKg.toFixed(1)} kg</h3>
          <p className="text-gray-400 text-sm">Total CO₂ Saved</p>
        </div>

        <div className="card bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border-emerald-500/30 text-center">
          <div className="text-4xl mb-3">🌳</div>
          <h3 className="text-3xl font-black text-white mb-1">{treesEquivalent}</h3>
          <p className="text-gray-400 text-sm">Trees Equivalent</p>
        </div>

        <div className="card bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30 text-center">
          <div className="text-4xl mb-3">🚗</div>
          <h3 className="text-3xl font-black text-white mb-1">{carsOffRoad}</h3>
          <p className="text-gray-400 text-sm">Cars Off Road (Year)</p>
        </div>

        <div className="card bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30 text-center">
          <div className="text-4xl mb-3">✈️</div>
          <h3 className="text-3xl font-black text-white mb-1">{flightsAvoided}</h3>
          <p className="text-gray-400 text-sm">Flights Avoided (Delhi-Mumbai)</p>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-xl font-bold text-white mb-6">Platform Health</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Ride Completion Rate</span>
                <span className="text-white font-semibold">
                  {stats?.rides?.total > 0 
                    ? ((stats.rides.completed / stats.rides.total) * 100).toFixed(1) 
                    : 0}%
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
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

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">User Verification Rate</span>
                <span className="text-white font-semibold">
                  {stats?.users?.total > 0 
                    ? (70).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '70%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Driver to Passenger Ratio</span>
                <span className="text-white font-semibold">
                  1:{stats?.users?.drivers > 0 
                    ? Math.round(stats.users.passengers / stats.users.drivers) 
                    : 0}
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '40%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold text-white mb-6">Key Metrics</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-400 text-sm">Total Users</span>
              <span className="text-white font-bold">{stats?.users?.total || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-400 text-sm">Active Rides</span>
              <span className="text-white font-bold">{stats?.rides?.active || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-400 text-sm">Total Revenue</span>
              <span className="text-green-400 font-bold">₹{(stats?.revenue || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-400 text-sm">New Users This Month</span>
              <span className="text-primary-400 font-bold">{stats?.users?.newThisMonth || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-400 text-sm">Total Bookings</span>
              <span className="text-white font-bold">{stats?.bookings?.total || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard