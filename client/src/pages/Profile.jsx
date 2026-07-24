import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FaUser, FaEnvelope, FaPhone, FaCar, FaLeaf, FaStar,
  FaEdit, FaSave, FaTimes, FaCamera, FaShieldAlt,
  FaTrophy, FaHistory, FaLock
} from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'

const Profile = () => {
  const { user, updateUser, fetchUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    gender: user?.gender || 'male',
    vehicleDetails: user?.vehicleDetails || {
      make: '',
      model: '',
      year: '',
      color: '',
      licensePlate: '',
      vehicleType: 'petrol',
      seatingCapacity: 4
    }
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        phone: user.phone,
        gender: user.gender,
        vehicleDetails: user.vehicleDetails || {
          make: '',
          model: '',
          year: '',
          color: '',
          licensePlate: '',
          vehicleType: 'petrol',
          seatingCapacity: 4
        }
      })
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleVehicleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      vehicleDetails: { ...prev.vehicleDetails, [name]: value }
    }))
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.put('/users/profile', formData)
      updateUser(data.user)
      toast.success('Profile updated successfully!')
      setEditing(false)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('avatar', file)

    setLoading(true)
    try {
      const { data } = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      updateUser(data.user)
      toast.success('Avatar updated!')
    } catch (error) {
      toast.error('Failed to upload avatar')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      toast.success('Password changed successfully!')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FaUser },
    { id: 'vehicle', label: 'Vehicle', icon: FaCar, driverOnly: true },
    { id: 'stats', label: 'Stats', icon: FaTrophy },
    { id: 'security', label: 'Security', icon: FaLock }
  ]

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-black text-white mb-2">My Profile</h1>
          <p className="text-gray-400">Manage your account settings</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              {/* Avatar */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <img
                    src={user?.avatar}
                    alt={user?.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary-500 mx-auto"
                  />
                  <label className="absolute bottom-0 right-0 w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-400 transition-colors">
                    <FaCamera className="text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <h2 className="text-xl font-bold text-white mt-4">{user?.name}</h2>
                <p className="text-gray-400 text-sm">{user?.email}</p>
                <div className="eco-badge mt-2 inline-flex">
                  <FaLeaf className="text-xs" />
                  {user?.ecoLevel}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FaTrophy className="text-yellow-400" />
                    <span className="text-gray-400 text-sm">Eco Points</span>
                  </div>
                  <span className="text-white font-semibold">{user?.ecoPoints || 0}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FaStar className="text-yellow-400" />
                    <span className="text-gray-400 text-sm">Rating</span>
                  </div>
                  <span className="text-white font-semibold">
                    {user?.averageRating?.toFixed(1) || '0.0'} ⭐
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FaHistory className="text-blue-400" />
                    <span className="text-gray-400 text-sm">Total Rides</span>
                  </div>
                  <span className="text-white font-semibold">{user?.totalRides || 0}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FaLeaf className="text-green-400" />
                    <span className="text-gray-400 text-sm">CO₂ Saved</span>
                  </div>
                  <span className="text-white font-semibold">
                    {user?.totalCO2Saved?.toFixed(1) || 0} kg
                  </span>
                </div>
              </div>

              {/* Referral */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="text-white font-semibold mb-2">Referral Code</h3>
                <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg">
                  <code className="text-primary-400 font-mono flex-1">{user?.referralCode}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(user?.referralCode)
                      toast.success('Copied!')
                    }}
                    className="text-xs text-primary-400 hover:text-primary-300"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {user?.referralCount || 0} friends joined
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {tabs
                .filter(tab => !tab.driverOnly || user?.role === 'driver')
                .map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    <tab.icon className="text-sm" />
                    {tab.label}
                  </button>
                ))}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Personal Information</h2>
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="btn-outline text-sm flex items-center gap-2"
                    >
                      <FaEdit /> Edit
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setEditing(false)
                        setFormData({
                          name: user.name,
                          phone: user.phone,
                          gender: user.gender,
                          vehicleDetails: user.vehicleDetails
                        })
                      }}
                      className="btn-outline text-sm flex items-center gap-2 text-red-400 border-red-500/30"
                    >
                      <FaTimes /> Cancel
                    </button>
                  )}
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!editing}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.email}
                      disabled
                      className="input-field opacity-50 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!editing}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      disabled={!editing}
                      className="input-field"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Role
                    </label>
                    <input
                      type="text"
                      value={user?.role}
                      disabled
                      className="input-field opacity-50 cursor-not-allowed capitalize"
                    />
                  </div>

                  {editing && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <FaSave /> Save Changes
                        </>
                      )}
                    </button>
                  )}
                </form>
              </motion.div>
            )}

            {/* Vehicle Tab (Driver Only) */}
            {activeTab === 'vehicle' && user?.role === 'driver' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Vehicle Information</h2>
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="btn-outline text-sm flex items-center gap-2"
                    >
                      <FaEdit /> Edit
                    </button>
                  ) : (
                    <button
                      onClick={() => setEditing(false)}
                      className="btn-outline text-sm flex items-center gap-2 text-red-400 border-red-500/30"
                    >
                      <FaTimes /> Cancel
                    </button>
                  )}
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Make
                      </label>
                      <input
                        type="text"
                        name="make"
                        value={formData.vehicleDetails.make}
                        onChange={handleVehicleChange}
                        disabled={!editing}
                        placeholder="Toyota"
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Model
                      </label>
                      <input
                        type="text"
                        name="model"
                        value={formData.vehicleDetails.model}
                        onChange={handleVehicleChange}
                        disabled={!editing}
                        placeholder="Camry"
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Year
                      </label>
                      <input
                        type="number"
                        name="year"
                        value={formData.vehicleDetails.year}
                        onChange={handleVehicleChange}
                        disabled={!editing}
                        placeholder="2020"
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Color
                      </label>
                      <input
                        type="text"
                        name="color"
                        value={formData.vehicleDetails.color}
                        onChange={handleVehicleChange}
                        disabled={!editing}
                        placeholder="White"
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        License Plate
                      </label>
                      <input
                        type="text"
                        name="licensePlate"
                        value={formData.vehicleDetails.licensePlate}
                        onChange={handleVehicleChange}
                        disabled={!editing}
                        placeholder="DL01AB1234"
                        className="input-field uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Vehicle Type
                      </label>
                      <select
                        name="vehicleType"
                        value={formData.vehicleDetails.vehicleType}
                        onChange={handleVehicleChange}
                        disabled={!editing}
                        className="input-field"
                      >
                        <option value="petrol">⛽ Petrol</option>
                        <option value="diesel">🛢️ Diesel</option>
                        <option value="hybrid">🔋 Hybrid</option>
                        <option value="electric">⚡ Electric</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Seating Capacity
                      </label>
                      <select
                        name="seatingCapacity"
                        value={formData.vehicleDetails.seatingCapacity}
                        onChange={handleVehicleChange}
                        disabled={!editing}
                        className="input-field"
                      >
                        {[2, 3, 4, 5, 6, 7, 8].map(n => (
                          <option key={n} value={n}>{n} seats</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {editing && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <FaSave /> Save Vehicle Info
                        </>
                      )}
                    </button>
                  )}
                </form>
              </motion.div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="card">
                  <h2 className="text-xl font-bold text-white mb-6">Eco Impact Statistics</h2>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-xl">
                      <div className="flex items-center gap-2 text-green-400 mb-2">
                        <FaLeaf />
                        <span className="text-sm font-medium">Total CO₂ Saved</span>
                      </div>
                      <p className="text-3xl font-black text-white">{user?.totalCO2Saved?.toFixed(1) || 0} kg</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Equivalent to {(user?.totalCO2Saved / 21).toFixed(2)} trees planted
                      </p>
                    </div>

                    <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
                      <div className="flex items-center gap-2 text-blue-400 mb-2">
                        <FaHistory />
                        <span className="text-sm font-medium">Total Distance</span>
                      </div>
                      <p className="text-3xl font-black text-white">
                        {user?.totalDistanceTravelled?.toFixed(0) || 0} km
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Across {user?.totalRides || 0} rides</p>
                    </div>

                    <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-xl">
                      <div className="flex items-center gap-2 text-purple-400 mb-2">
                        <FaTrophy />
                        <span className="text-sm font-medium">Eco Points</span>
                      </div>
                      <p className="text-3xl font-black text-white">{user?.ecoPoints || 0}</p>
                      <p className="text-xs text-gray-400 mt-1">Level: {user?.ecoLevel}</p>
                    </div>

                    <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-xl">
                      <div className="flex items-center gap-2 text-yellow-400 mb-2">
                        <FaStar />
                        <span className="text-sm font-medium">User Rating</span>
                      </div>
                      <p className="text-3xl font-black text-white">
                        {user?.averageRating?.toFixed(1) || '0.0'} ⭐
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Based on {user?.totalRatings || 0} reviews
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h2 className="text-xl font-bold text-white mb-4">Achievements</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { emoji: '🌱', label: 'First Ride', earned: user?.totalRides >= 1 },
                      { emoji: '🌿', label: '10 Rides', earned: user?.totalRides >= 10 },
                      { emoji: '🌳', label: '50 Rides', earned: user?.totalRides >= 50 },
                      { emoji: '🌲', label: '100 Rides', earned: user?.totalRides >= 100 },
                      { emoji: '♻️', label: '100kg CO₂', earned: user?.totalCO2Saved >= 100 },
                      { emoji: '🏆', label: 'Top Rated', earned: user?.averageRating >= 4.5 },
                      { emoji: '⚡', label: 'Eco Warrior', earned: user?.ecoPoints >= 1000 },
                      { emoji: '🎖️', label: 'Eco Hero', earned: user?.ecoLevel === 'EcoHero' }
                    ].map((achievement, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-xl text-center transition-all ${
                          achievement.earned
                            ? 'bg-primary-500/20 border-2 border-primary-500/50'
                            : 'bg-gray-800/30 border border-gray-700 opacity-40'
                        }`}
                      >
                        <div className="text-3xl mb-2">{achievement.emoji}</div>
                        <p className="text-xs text-white font-medium">{achievement.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card"
              >
                <h2 className="text-xl font-bold text-white mb-6">Change Password</h2>
                
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="••••••••"
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="••••••••"
                      className="input-field"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="••••••••"
                      className="input-field"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Changing...
                      </>
                    ) : (
                      <>
                        <FaLock /> Change Password
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-8 pt-8 border-t border-gray-700">
                  <h3 className="text-white font-semibold mb-4">Account Security</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FaShieldAlt className="text-green-400" />
                        <span className="text-gray-300 text-sm">Email Verified</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        user?.isVerified 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {user?.isVerified ? '✓ Verified' : 'Not Verified'}
                      </span>
                    </div>

                    {user?.role === 'driver' && (
                      <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FaCar className="text-blue-400" />
                          <span className="text-gray-300 text-sm">Driver License</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          user?.driverLicense?.verified 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {user?.driverLicense?.verified ? '✓ Verified' : 'Pending'}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FaStar className="text-yellow-400" />
                        <span className="text-gray-300 text-sm">Safety Score</span>
                      </div>
                      <span className="text-white font-semibold">{user?.safetyScore || 75}/100</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile