import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FaUser, FaEnvelope, FaPhone, FaCar, FaLeaf, FaStar,
  FaEdit, FaSave, FaTimes, FaCamera, FaShieldAlt,
  FaTrophy, FaHistory, FaLock
} from 'react-icons/fa'
import { useAuth } from '../contexts/AuthContext'
import GlassCard from '../components/ui/GlassCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import safetyService from '../services/safetyService'
import TrustScoreCircle from '../components/ui/TrustScoreCircle'
import VerificationBadge from '../components/ui/VerificationBadge'

const Profile = () => {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
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

    const avatarFormData = new FormData()
    avatarFormData.append('avatar', file)

    setLoading(true)
    try {
      const { data } = await api.post('/users/avatar', avatarFormData, {
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
    { id: 'profile', label: 'Profile Settings', icon: FaUser },
    { id: 'vehicle', label: 'Vehicle Specs', icon: FaCar, driverOnly: true },
    { id: 'verification', label: 'Driver Verification', icon: FaShieldAlt, driverOnly: true },
    { id: 'safety', label: 'Safety Settings', icon: FaShieldAlt },
    { id: 'stats', label: 'Achievements', icon: FaTrophy },
    { id: 'security', label: 'Security Panel', icon: FaLock }
  ]

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-black font-display text-white tracking-tight">Account Configuration</h1>
        <p className="text-gray-400 text-sm font-medium mt-1">Configure profile details, vehicle metadata, and security settings.</p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sidebar details */}
        <div className="lg:col-span-1">
          <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 sticky top-24 p-6">
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <img
                  src={user?.avatar || 'https://res.cloudinary.com/demo/image/upload/v1/default-avatar.png'}
                  alt={user?.name}
                  className="w-24 h-24 rounded-full object-cover border border-white/10 mx-auto"
                />
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-400 transition-colors shadow-lg">
                  <FaCamera className="text-white text-xs" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <h2 className="text-lg font-bold text-white mt-4">{user?.name}</h2>
              <p className="text-gray-500 text-xs mt-1 font-semibold">{user?.email}</p>
              <div className="eco-badge mt-2.5 uppercase font-black text-[9px] tracking-wider">
                <FaLeaf className="text-[10px]" />
                {user?.ecoLevel || 'Seedling'}
              </div>
            </div>

            {/* Trust Score & Badges */}
            <div className="border-t border-white/5 pt-4 pb-2 text-center">
              <TrustScoreCircle score={user?.safetyScore || 75} size={105} />
              <div className="mt-2 flex justify-center">
                <VerificationBadge status={user?.isVerified ? 'verified' : 'unverified'} />
              </div>
            </div>

            {/* Micro Stats Panel */}
            <div className="space-y-2 border-t border-white/5 pt-4">
              <div className="flex items-center justify-between p-3 bg-dark-950/60 border border-white/5 rounded-xl text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <FaTrophy className="text-yellow-400" />
                  <span className="text-gray-400">Eco Points</span>
                </div>
                <span className="text-white font-bold">{user?.ecoPoints || 0} PTS</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-dark-950/60 border border-white/5 rounded-xl text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <FaStar className="text-yellow-400" />
                  <span className="text-gray-400">Trust Rating</span>
                </div>
                <span className="text-white font-bold">{user?.averageRating?.toFixed(1) || '0.0'} ⭐</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-dark-950/60 border border-white/5 rounded-xl text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <FaHistory className="text-blue-400" />
                  <span className="text-gray-400">Completed Trips</span>
                </div>
                <span className="text-white font-bold">{user?.totalRides || 0}</span>
              </div>

              <div 
                onClick={() => navigate('/carbon-analytics')}
                className="flex items-center justify-between p-3 bg-dark-950/60 border border-white/5 hover:border-green-500/20 hover:bg-green-500/5 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                title="View Carbon Analytics Center"
              >
                <div className="flex items-center gap-2">
                  <FaLeaf className="text-green-400" />
                  <span className="text-gray-400">Emissions Offset</span>
                </div>
                <span className="text-white font-bold">{user?.totalCO2Saved?.toFixed(1) || 0} kg</span>
              </div>
            </div>

            {/* Copy Referral */}
            <div className="mt-6 pt-5 border-t border-white/5 space-y-2">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider text-gray-500">Referral ID</h4>
              <div className="flex items-center gap-2 p-3 bg-dark-950/60 border border-white/5 rounded-xl">
                <code className="text-primary-400 font-mono text-xs font-black uppercase flex-1">{user?.referralCode}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(user?.referralCode)
                    toast.success('Referral code copied!')
                  }}
                  className="text-xs text-primary-400 hover:text-primary-300 font-bold cursor-pointer"
                >
                  Copy
                </button>
              </div>
              <p className="text-[10px] text-gray-600 font-bold uppercase mt-1">
                {user?.referralCount || 0} active companion references
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Main tabs view */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Selection */}
          <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/5 scrollbar-thin">
            {tabs
              .filter(tab => !tab.driverOnly || user?.role === 'driver')
              .map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setEditing(false)
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'bg-primary-500/10 text-primary-400 border-primary-500/25'
                      : 'bg-dark-900/40 text-gray-400 border-transparent hover:text-white'
                    }`}
                >
                  <tab.icon className="text-[10px]" />
                  {tab.label}
                </button>
              ))}
          </div>

          {/* Profile Details Tab */}
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-white font-bold font-display text-lg">Personal Details</h3>
                  {!editing ? (
                    <AnimatedButton
                      variant="secondary"
                      onClick={() => setEditing(true)}
                      className="text-xs uppercase tracking-wider py-2 px-4 font-bold"
                    >
                      Edit Info
                    </AnimatedButton>
                  ) : (
                    <AnimatedButton
                      variant="danger"
                      onClick={() => {
                        setEditing(false)
                        setFormData({
                          name: user.name,
                          phone: user.phone,
                          gender: user.gender,
                          vehicleDetails: user.vehicleDetails
                        })
                      }}
                      className="text-xs uppercase tracking-wider py-2 px-4 font-bold"
                    >
                      Cancel
                    </AnimatedButton>
                  )}
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!editing}
                      className="input-field bg-dark-950/80 text-sm disabled:opacity-55 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Email Address</label>
                    <input
                      type="email"
                      value={user?.email}
                      disabled
                      className="input-field bg-dark-950/80 text-sm opacity-50 cursor-not-allowed"
                    />
                    <span className="text-[10px] text-gray-600 font-bold uppercase block mt-1">Contact email cannot be modified</span>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!editing}
                      className="input-field bg-dark-950/80 text-sm disabled:opacity-55 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      disabled={!editing}
                      className="input-field bg-dark-950/80 text-sm disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer py-3"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Account Role</label>
                    <input
                      type="text"
                      value={user?.role}
                      disabled
                      className="input-field bg-dark-950/80 text-sm opacity-50 cursor-not-allowed capitalize font-bold"
                    />
                  </div>

                  {editing && (
                    <AnimatedButton
                      type="submit"
                      variant="primary"
                      disabled={loading}
                      fullWidth
                      className="text-xs font-black uppercase tracking-wider py-3.5 mt-4"
                    >
                      {loading ? 'Saving Changes...' : 'Save Configuration Changes'}
                    </AnimatedButton>
                  )}
                </form>
              </GlassCard>
            </motion.div>
          )}

          {/* Vehicle Tab (Driver Only) */}
          {activeTab === 'vehicle' && user?.role === 'driver' && (
            <motion.div
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-white font-bold font-display text-lg">Vehicle Metadata</h3>
                  {!editing ? (
                    <AnimatedButton
                      variant="secondary"
                      onClick={() => setEditing(true)}
                      className="text-xs uppercase tracking-wider py-2 px-4 font-bold"
                    >
                      Edit Vehicle
                    </AnimatedButton>
                  ) : (
                    <AnimatedButton
                      variant="danger"
                      onClick={() => setEditing(false)}
                      className="text-xs uppercase tracking-wider py-2 px-4 font-bold"
                    >
                      Cancel
                    </AnimatedButton>
                  )}
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Make</label>
                      <input
                        type="text"
                        name="make"
                        value={formData.vehicleDetails.make}
                        onChange={handleVehicleChange}
                        disabled={!editing}
                        placeholder="Toyota"
                        className="input-field bg-dark-950/80 text-sm disabled:opacity-55"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Model</label>
                      <input
                        type="text"
                        name="model"
                        value={formData.vehicleDetails.model}
                        onChange={handleVehicleChange}
                        disabled={!editing}
                        placeholder="Camry"
                        className="input-field bg-dark-950/80 text-sm disabled:opacity-55"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Manufacture Year</label>
                      <input
                        type="number"
                        name="year"
                        value={formData.vehicleDetails.year}
                        onChange={handleVehicleChange}
                        disabled={!editing}
                        placeholder="2020"
                        className="input-field bg-dark-950/80 text-sm disabled:opacity-55"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Body Color</label>
                      <input
                        type="text"
                        name="color"
                        value={formData.vehicleDetails.color}
                        onChange={handleVehicleChange}
                        disabled={!editing}
                        placeholder="White"
                        className="input-field bg-dark-950/80 text-sm disabled:opacity-55"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">License Plate</label>
                      <input
                        type="text"
                        name="licensePlate"
                        value={formData.vehicleDetails.licensePlate}
                        onChange={handleVehicleChange}
                        disabled={!editing}
                        placeholder="DL01AB1234"
                        className="input-field bg-dark-950/80 text-sm disabled:opacity-55 uppercase font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Fuel Type</label>
                      <select
                        name="vehicleType"
                        value={formData.vehicleDetails.vehicleType}
                        onChange={handleVehicleChange}
                        disabled={!editing}
                        className="input-field bg-dark-950/80 text-sm cursor-pointer disabled:opacity-55 py-3"
                      >
                        <option value="petrol">⛽ Petrol</option>
                        <option value="diesel">🛢️ Diesel</option>
                        <option value="hybrid">🔋 Hybrid</option>
                        <option value="electric">⚡ Electric</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Seating Capacity</label>
                      <select
                        name="seatingCapacity"
                        value={formData.vehicleDetails.seatingCapacity}
                        onChange={handleVehicleChange}
                        disabled={!editing}
                        className="input-field bg-dark-950/80 text-sm cursor-pointer disabled:opacity-55 py-3"
                      >
                        {[2, 3, 4, 5, 6, 7, 8].map(n => (
                          <option key={n} value={n}>{n} seats available</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {editing && (
                    <AnimatedButton
                      type="submit"
                      variant="primary"
                      disabled={loading}
                      fullWidth
                      className="text-xs font-black uppercase tracking-wider py-3.5 mt-4"
                    >
                      {loading ? 'Saving Vehicle Data...' : 'Save Vehicle Metadata'}
                    </AnimatedButton>
                  )}
                </form>
              </GlassCard>
            </motion.div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <motion.div
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Eco statistics */}
              <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-6">
                <h3 className="text-white font-bold font-display text-lg mb-6">Environmental Stats</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-xs space-y-2">
                    <span className="flex items-center gap-1.5 text-green-400 font-bold uppercase tracking-wider">
                      <FaLeaf /> Total CO₂ Saved
                    </span>
                    <p className="text-3xl font-black text-white font-display leading-tight">{user?.totalCO2Saved?.toFixed(1) || 0} kg</p>
                    <p className="text-gray-500 font-bold uppercase text-[9px]">Equates to {(user?.totalCO2Saved / 21).toFixed(1)} trees planted yearly</p>
                  </div>

                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs space-y-2">
                    <span className="flex items-center gap-1.5 text-blue-400 font-bold uppercase tracking-wider">
                      <FaHistory /> Total Distance
                    </span>
                    <p className="text-3xl font-black text-white font-display leading-tight">{user?.totalDistanceTravelled?.toFixed(0) || 0} km</p>
                    <p className="text-gray-500 font-bold uppercase text-[9px]">Covered across {user?.totalRides || 0} transit schedules</p>
                  </div>
                </div>
              </GlassCard>

              {/* Achievements Grid */}
              <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-6">
                <h3 className="text-white font-bold font-display text-lg mb-4">Achievements earned</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { emoji: '🌱', label: 'First Commute', earned: user?.totalRides >= 1 },
                    { emoji: '🌿', label: '10 Commutes', earned: user?.totalRides >= 10 },
                    { emoji: '🌳', label: '50 Commutes', earned: user?.totalRides >= 50 },
                    { emoji: '🌲', label: '100 Commutes', earned: user?.totalRides >= 100 },
                    { emoji: '♻️', label: '100kg CO₂ Offset', earned: user?.totalCO2Saved >= 100 },
                    { emoji: '🏆', label: 'Top Rated Rider', earned: user?.averageRating >= 4.5 },
                    { emoji: '⚡', label: 'Eco Warrior', earned: user?.ecoPoints >= 1000 },
                    { emoji: '🎖️', label: 'Eco Hero Status', earned: user?.ecoLevel === 'EcoHero' }
                  ].map((achievement, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-2xl border text-center transition-all ${
                        achievement.earned
                          ? 'bg-primary-500/10 border-primary-500/25 text-white'
                          : 'bg-dark-950 border-white/5 opacity-25'
                      }`}
                    >
                      <div className="text-2xl mb-1.5">{achievement.emoji}</div>
                      <p className="text-[10px] font-black uppercase tracking-wider">{achievement.label}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-6 space-y-6">
                <h3 className="text-white font-bold font-display text-lg">Account Protection</h3>
                
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="••••••••"
                      className="input-field bg-dark-950/80 text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="••••••••"
                      className="input-field bg-dark-950/80 text-sm"
                      required
                    />
                    <span className="text-[9px] text-gray-600 font-bold uppercase block mt-1">Minimum 6 characters</span>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Confirm Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="••••••••"
                      className="input-field bg-dark-950/80 text-sm"
                      required
                    />
                  </div>

                  <AnimatedButton
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    fullWidth
                    className="text-xs font-black uppercase tracking-wider py-3.5 mt-4"
                  >
                    {loading ? 'Updating Credentials...' : 'Save New Credentials'}
                  </AnimatedButton>
                </form>

                {/* Status verification cards */}
                <div className="pt-6 border-t border-white/5 space-y-3">
                  <h4 className="text-white font-bold text-xs uppercase tracking-wider text-gray-500">Security Credentials</h4>
                  
                  <div className="flex items-center justify-between p-3.5 bg-dark-950/60 border border-white/5 rounded-xl text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <FaShieldAlt className="text-green-400" />
                      <span className="text-gray-400">Primary Email Status</span>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      user?.isVerified 
                        ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {user?.isVerified ? 'VERIFIED' : 'PENDING'}
                    </span>
                  </div>

                  {user?.role === 'driver' && (
                    <div className="flex items-center justify-between p-3.5 bg-dark-950/60 border border-white/5 rounded-xl text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <FaCar className="text-blue-400" />
                        <span className="text-gray-400">License Verification</span>
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        user?.driverLicense?.verified 
                          ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                          : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                      }`}>
                        {user?.driverLicense?.verified ? 'VERIFIED' : 'PENDING REVIEW'}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3.5 bg-dark-950/60 border border-white/5 rounded-xl text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <FaStar className="text-yellow-400" />
                      <span className="text-gray-400">Driver Safety Index</span>
                    </div>
                    <span className="text-white font-black font-display text-sm">{user?.safetyScore || 75}/100</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Safety Settings Tab */}
          {activeTab === 'safety' && (
            <motion.div
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-500/10 border border-primary-500/20 text-primary-400 rounded-xl flex items-center justify-center text-lg">
                    <FaShieldAlt />
                  </div>
                  <div>
                    <h3 className="text-white font-bold font-display text-lg">Safety Configuration</h3>
                    <p className="text-gray-400 text-xs mt-0.5">Manage trust systems and safety defaults.</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-4">
                  <p className="text-xs text-gray-400 font-semibold leading-relaxed">
                    You can register trusted companions to receive real-time location telemetry updates and notifications if you trigger an active SOS alert.
                  </p>
                  
                  <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-white text-xs font-bold">Trusted Safety Contacts</p>
                      <p className="text-gray-400 text-[10px] uppercase font-semibold mt-0.5">Define emergency numbers & preferences</p>
                    </div>
                    <AnimatedButton 
                      onClick={() => navigate('/safety/contacts')} 
                      variant="primary" 
                      className="text-xs py-2.5 px-4 font-bold uppercase tracking-wider"
                    >
                      Manage Contacts
                    </AnimatedButton>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Driver Verification Tab */}
          {activeTab === 'verification' && (
            <motion.div
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-500/10 border border-primary-500/20 text-primary-400 rounded-xl flex items-center justify-center text-lg">
                    <FaCar />
                  </div>
                  <div>
                    <h3 className="text-white font-bold font-display text-lg">Driver Credentials</h3>
                    <p className="text-gray-400 text-xs mt-0.5">Submit legal documents to request verified badges.</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Driver Status</span>
                      <p className="text-white text-xs font-bold mt-1">
                        {user?.driverVerificationStatus || 'NOT_STARTED'}
                      </p>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Vehicle Status</span>
                      <p className="text-white text-xs font-bold mt-1">
                        {user?.vehicleVerificationStatus || 'NOT_STARTED'}
                      </p>
                    </div>
                  </div>

                  {user?.driverVerificationStatus === 'NOT_STARTED' || user?.driverVerificationStatus === 'REJECTED' ? (
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const license = e.target.license.value;
                        if (!license) return toast.error('Enter license number');
                        try {
                          const data = await safetyService.submitVerification({ type: 'driver', licenseNumber: license });
                          updateUser(data.user);
                          toast.success('Driver verification submitted successfully!');
                        } catch (err) {
                          toast.error('Failed to submit verification');
                        }
                      }} 
                      className="space-y-4"
                    >
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Driver License Number</label>
                        <input
                          type="text"
                          name="license"
                          placeholder="e.g. DL-XXXXXXXXXXXXX"
                          className="input-field bg-dark-950/80 text-sm py-2.5"
                          required
                        />
                      </div>
                      <AnimatedButton type="submit" variant="primary" className="py-2.5 px-5 text-xs font-bold uppercase tracking-wider">
                        Submit License for Approval
                      </AnimatedButton>
                    </form>
                  ) : (
                    <div className="p-4 bg-primary-500/5 border border-primary-500/10 rounded-xl">
                      <p className="text-xs text-gray-300 font-semibold leading-relaxed">
                        🔒 Your driver credentials are currently {user?.driverVerificationStatus?.replace('_', ' ').toLowerCase()}.
                        We will notify you once reviews are concluded.
                      </p>
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
