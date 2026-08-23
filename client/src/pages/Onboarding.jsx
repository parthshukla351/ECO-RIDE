import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaUser, FaCar, FaLeaf, FaCamera, FaUpload, FaCheckCircle,
  FaShieldAlt, FaComments, FaArrowRight, FaArrowLeft, FaClock
} from 'react-icons/fa'
import { useAuth } from '../contexts/AuthContext'
import GlassCard from '../components/ui/GlassCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import RoleCard from '../components/ui/RoleCard'
import TrustScoreCircle from '../components/ui/TrustScoreCircle'
import api from '../services/api'
import toast from 'react-hot-toast'

const Onboarding = () => {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user && user.profileCompleted) {
      const dashboardPath = user.role === 'driver' ? '/driver/dashboard' : '/dashboard'
      navigate(dashboardPath, { replace: true })
    }
  }, [user, navigate])

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState(user?.role || 'passenger')
  
  // Basic Info state
  const [bio, setBio] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState(user?.gender || 'male')
  const [phone, setPhone] = useState(user?.phone || '')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [company, setCompany] = useState('')
  const [languages, setLanguages] = useState('')
  const [avatar, setAvatar] = useState(user?.avatar || '')

  // Preferences state
  const [womenOnly, setWomenOnly] = useState(false)
  const [petsAllowed, setPetsAllowed] = useState(false)
  const [smokingAllowed, setSmokingAllowed] = useState(false)
  const [musicAllowed, setMusicAllowed] = useState(true)
  const [acAvailable, setAcAvailable] = useState(true)
  const [luggageAllowed, setLuggageAllowed] = useState(true)
  const [conversationPref, setConversationPref] = useState('normal')

  // Vehicle state
  const [vehicleMake, setVehicleMake] = useState(user?.vehicleDetails?.make || '')
  const [vehicleModel, setVehicleModel] = useState(user?.vehicleDetails?.model || '')
  const [vehicleYear, setVehicleYear] = useState(user?.vehicleDetails?.year || '')
  const [vehicleColor, setVehicleColor] = useState(user?.vehicleDetails?.color || '')
  const [licensePlate, setLicensePlate] = useState(user?.vehicleDetails?.licensePlate || '')
  const [vehicleType, setVehicleType] = useState(user?.vehicleDetails?.vehicleType || 'electric')
  const [seatingCapacity, setSeatingCapacity] = useState(user?.vehicleDetails?.seatingCapacity || 4)

  // KYC state
  const [docType, setDocType] = useState('driving_license')
  const [docNumber, setDocNumber] = useState(user?.driverLicense?.number || '')
  const [docFront, setDocFront] = useState(null)
  const [docBack, setDocBack] = useState(null)
  const [docFrontUrl, setDocFrontUrl] = useState('')
  const [docBackUrl, setDocBackUrl] = useState('')

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
      setAvatar(data.avatar)
      updateUser(data.user)
      toast.success('Onboarding photo uploaded!')
    } catch {
      toast.error('Failed to upload photo')
    } finally {
      setLoading(false)
    }
  }

  const handleDocFrontUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setDocFront(file)
    setDocFrontUrl(URL.createObjectURL(file))
  }

  const handleDocBackUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setDocBack(file)
    setDocBackUrl(URL.createObjectURL(file))
  }

  const handleNextStep = () => {
    if (step === 1) {
      setStep(2)
    } else if (step === 2) {
      if (!phone) {
        toast.error('Phone number is required')
        return
      }
      setStep(3)
    } else if (step === 3) {
      if (role === 'driver') {
        setStep(4)
      } else {
        setStep(5) // skip vehicle
      }
    } else if (step === 4) {
      if (!vehicleMake || !vehicleModel || !licensePlate) {
        toast.error('Please complete vehicle fields')
        return
      }
      setStep(5)
    } else if (step === 5) {
      setStep(6)
    }
  }

  const handlePrevStep = () => {
    if (step === 5 && role !== 'driver') {
      setStep(3) // skip vehicle back
    } else {
      setStep(prev => prev - 1)
    }
  }

  const handleCompleteOnboarding = async () => {
    setLoading(true)
    try {
      const profileData = {
        role,
        gender,
        phone,
        profileCompleted: true,
        preferences: {
          womenOnly,
          petsAllowed,
          smokingAllowed,
          musicAllowed,
          acAvailable,
          luggageAllowed,
          conversationPref
        }
      }

      if (role === 'driver') {
        profileData.vehicleDetails = {
          make: vehicleMake,
          model: vehicleModel,
          year: parseInt(vehicleYear) || undefined,
          color: vehicleColor,
          licensePlate,
          vehicleType,
          seatingCapacity: parseInt(seatingCapacity)
        }
        profileData.driverLicense = {
          number: docNumber,
          verified: false,
          image: docFrontUrl // architecture preview ready
        }
      }

      const { data } = await api.put('/users/profile', profileData)
      updateUser(data.user)

      toast.success('Onboarding profile completion successful! 🌱')
      const dashboardPath = role === 'driver' ? '/driver/dashboard' : '/dashboard'
      navigate(dashboardPath)
    } catch (err) {
      toast.error('Failed to complete onboarding profile')
    } finally {
      setLoading(false)
    }
  }

  const stepsList = [
    { label: 'Role Selection' },
    { label: 'Basic Profile' },
    { label: 'Ride Preferences' },
    { label: 'Vehicle details' },
    { label: 'Identity Verification' },
    { label: 'Confirmation' }
  ]

  const currentOnboardingScore = () => {
    let score = 75 // Base trust score for new users
    if (phone) score += 5
    if (avatar) score += 5
    if (bio) score += 5
    if (docNumber) score += 10
    return Math.min(100, score)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Progress indicators header */}
      <div className="flex justify-between items-center bg-dark-900/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
        <span className="text-[10px] font-black uppercase tracking-widest text-primary-400">Onboarding wizard</span>
        <span className="text-[10px] text-gray-500 font-bold uppercase">Step {step} of 6</span>
      </div>

      <div className="flex gap-1.5 h-1.5 bg-white/5 rounded-full overflow-hidden">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className={`h-full flex-1 rounded-full transition-all duration-300 ${
              idx + 1 <= step ? 'bg-primary-500' : 'bg-white/5'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
        >
          {/* Step 1: Role Confirmation */}
          {step === 1 && (
            <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-8 space-y-6">
              <div>
                <h2 className="text-xl font-black font-display text-white tracking-tight">Confirm Account Role</h2>
                <p className="text-gray-400 text-xs mt-1">Select your primary activity. You can customize vehicle profiles later.</p>
              </div>

              <RoleCard value={role} onChange={setRole} />

              <div className="pt-4 border-t border-white/5 flex justify-end">
                <AnimatedButton onClick={handleNextStep} variant="primary" className="text-xs uppercase tracking-wider py-2.5 px-6">
                  Continue Journey <FaArrowRight className="text-[9px]" />
                </AnimatedButton>
              </div>
            </GlassCard>
          )}

          {/* Step 2: Basic Profile Information */}
          {step === 2 && (
            <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-8 space-y-6">
              <div>
                <h2 className="text-xl font-black font-display text-white tracking-tight">Basic Profile Details</h2>
                <p className="text-gray-400 text-xs mt-1">Build trust within the ridesharing network.</p>
              </div>

              {/* Profile Photo Uploader */}
              <div className="flex items-center gap-4 bg-dark-950/60 border border-white/5 p-4 rounded-2xl">
                <div className="relative">
                  <img
                    src={avatar || 'https://res.cloudinary.com/demo/image/upload/v1/default-avatar.png'}
                    alt="Onboarding Avatar"
                    className="w-16 h-16 rounded-full object-cover border border-white/10"
                  />
                  <label className="absolute bottom-0 right-0 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center cursor-pointer shadow hover:bg-primary-400 transition-colors">
                    <FaCamera className="text-white text-[9px]" />
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                </div>
                <div>
                  <h4 className="text-white font-bold text-xs uppercase tracking-wider">Profile Photo</h4>
                  <p className="text-gray-500 text-[10px] mt-0.5 leading-normal">Help companions identify you at meetups.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Mobile Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    maxLength={10}
                    className="input-field bg-dark-950/80 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="21"
                      className="input-field bg-dark-950/80 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="input-field bg-dark-950/80 text-sm py-3 cursor-pointer"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Emergency mobile number"
                    maxLength={10}
                    className="input-field bg-dark-950/80 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">College / Employer</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="IIT Delhi / Google"
                    className="input-field bg-dark-950/80 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Bio Description</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Short details about yourself..."
                    className="input-field bg-dark-950/80 text-sm h-20 py-2.5 resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-between">
                <AnimatedButton onClick={handlePrevStep} variant="secondary" className="text-xs uppercase tracking-wider py-2.5 px-6">
                  Back
                </AnimatedButton>
                <AnimatedButton onClick={handleNextStep} variant="primary" className="text-xs uppercase tracking-wider py-2.5 px-6">
                  Continue
                </AnimatedButton>
              </div>
            </GlassCard>
          )}

          {/* Step 3: Ride Preferences */}
          {step === 3 && (
            <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-8 space-y-6">
              <div>
                <h2 className="text-xl font-black font-display text-white tracking-tight">Commuting Preferences</h2>
                <p className="text-gray-400 text-xs mt-1">Configure default travel filters for ride matching search lists.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { state: womenOnly, setter: setWomenOnly, label: 'Women-only matches', desc: 'Rides visible to female passengers only.' },
                  { state: petsAllowed, setter: setPetsAllowed, label: 'Pet-friendly commutes', desc: 'Pets allowed inside the vehicle.' },
                  { state: smokingAllowed, setter: setSmokingAllowed, label: 'Smoking allowed', desc: 'Permit smoking inside vehicle cabins.' },
                  { state: musicAllowed, setter: setMusicAllowed, label: 'In-ride music playback', desc: 'Listen to playlists during travel.' },
                  { state: acAvailable, setter: setAcAvailable, label: 'Air conditioning', desc: 'Cabin AC active during trip.' },
                  { state: luggageAllowed, setter: setLuggageAllowed, label: 'Luggage allowed', desc: 'Space allocated for bags.' }
                ].map((pref, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pref.setter(!pref.state)}
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col gap-2 cursor-pointer
                      ${pref.state
                        ? 'bg-primary-500/10 border-primary-500/30 text-white'
                        : 'bg-dark-950/80 border-white/5 text-gray-400'
                      }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-white font-bold text-xs uppercase tracking-wider">{pref.label}</span>
                      <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[8px]
                        ${pref.state ? 'border-primary-500 bg-primary-500 text-white' : 'border-white/10'}`}>
                        {pref.state && '✓'}
                      </span>
                    </div>
                    <p className="text-gray-500 text-[10px] leading-normal font-semibold">{pref.desc}</p>
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-between">
                <AnimatedButton onClick={handlePrevStep} variant="secondary" className="text-xs uppercase tracking-wider py-2.5 px-6">
                  Back
                </AnimatedButton>
                <AnimatedButton onClick={handleNextStep} variant="primary" className="text-xs uppercase tracking-wider py-2.5 px-6">
                  Continue
                </AnimatedButton>
              </div>
            </GlassCard>
          )}

          {/* Step 4: Vehicle Specification (Driver only) */}
          {step === 4 && (
            <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-8 space-y-6">
              <div>
                <h2 className="text-xl font-black font-display text-white tracking-tight">Vehicle Specifications</h2>
                <p className="text-gray-400 text-xs mt-1">Specify make and licensing for travel listings verification.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Make / Manufacturer</label>
                  <input
                    type="text"
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    placeholder="Tesla / Toyota"
                    className="input-field bg-dark-950/80 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Model</label>
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="Model 3 / Camry"
                    className="input-field bg-dark-950/80 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Manufacture Year</label>
                  <input
                    type="number"
                    value={vehicleYear}
                    onChange={(e) => setVehicleYear(e.target.value)}
                    placeholder="2022"
                    className="input-field bg-dark-950/80 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Vehicle Color</label>
                  <input
                    type="text"
                    value={vehicleColor}
                    onChange={(e) => setVehicleColor(e.target.value)}
                    placeholder="Obsidian Black"
                    className="input-field bg-dark-950/80 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Registration License Plate</label>
                  <input
                    type="text"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    placeholder="DL01AB1234"
                    className="input-field bg-dark-950/80 text-sm uppercase font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Fuel Infrastructure</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="input-field bg-dark-950/80 text-sm cursor-pointer py-3"
                  >
                    <option value="electric">⚡ Electric EV</option>
                    <option value="hybrid">🔋 Hybrid</option>
                    <option value="petrol">⛽ Petrol</option>
                    <option value="diesel">🛢️ Diesel</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Seating Capacity</label>
                  <select
                    value={seatingCapacity}
                    onChange={(e) => setSeatingCapacity(parseInt(e.target.value))}
                    className="input-field bg-dark-950/80 text-sm cursor-pointer py-3"
                  >
                    {[2, 3, 4, 5, 6, 7, 8].map(n => (
                      <option key={n} value={n}>{n} Seats</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-between">
                <AnimatedButton onClick={handlePrevStep} variant="secondary" className="text-xs uppercase tracking-wider py-2.5 px-6">
                  Back
                </AnimatedButton>
                <AnimatedButton onClick={handleNextStep} variant="primary" className="text-xs uppercase tracking-wider py-2.5 px-6">
                  Continue
                </AnimatedButton>
              </div>
            </GlassCard>
          )}

          {/* Step 5: Identity / KYC documentation */}
          {step === 5 && (
            <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-8 space-y-6">
              <div>
                <h2 className="text-xl font-black font-display text-white tracking-tight">Identity Verification (KYC)</h2>
                <p className="text-gray-400 text-xs mt-1">Upload files to verify user verification tags.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Document Type</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="input-field bg-dark-950/80 text-sm cursor-pointer py-3"
                    >
                      <option value="driving_license">Driving License</option>
                      <option value="government_id">Government ID Card</option>
                      <option value="passport">Passport Booklet</option>
                      <option value="student_id">Student ID Card</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Document Identification ID</label>
                    <input
                      type="text"
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      placeholder="Enter doc / licence index"
                      className="input-field bg-dark-950/80 text-sm"
                    />
                  </div>
                </div>

                {/* Upload document front scan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Document Scan Front</label>
                    {docFrontUrl ? (
                      <div className="relative border border-white/5 rounded-2xl overflow-hidden bg-dark-950/60 p-2">
                        <img src={docFrontUrl} alt="Doc Front Preview" className="w-full h-32 object-contain rounded-xl" />
                        <button
                          onClick={() => { setDocFront(null); setDocFrontUrl('') }}
                          className="absolute top-4 right-4 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-1.5 text-[9px] font-black uppercase transition-colors"
                        >
                          ✕ Remove
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-white/10 hover:border-primary-500/20 hover:bg-white/1 transition-all rounded-2xl h-36 flex flex-col items-center justify-center cursor-pointer text-center p-4">
                        <FaUpload className="text-gray-500 text-lg mb-2" />
                        <span className="text-[10px] text-white font-bold uppercase tracking-wider">Upload Front Side</span>
                        <input type="file" accept="image/*" onChange={handleDocFrontUpload} className="hidden" />
                      </label>
                    )}
                  </div>

                  {/* Upload document back scan */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Document Scan Back</label>
                    {docBackUrl ? (
                      <div className="relative border border-white/5 rounded-2xl overflow-hidden bg-dark-950/60 p-2">
                        <img src={docBackUrl} alt="Doc Back Preview" className="w-full h-32 object-contain rounded-xl" />
                        <button
                          onClick={() => { setDocBack(null); setDocBackUrl('') }}
                          className="absolute top-4 right-4 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-1.5 text-[9px] font-black uppercase transition-colors"
                        >
                          ✕ Remove
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-white/10 hover:border-primary-500/20 hover:bg-white/1 transition-all rounded-2xl h-36 flex flex-col items-center justify-center cursor-pointer text-center p-4">
                        <FaUpload className="text-gray-500 text-lg mb-2" />
                        <span className="text-[10px] text-white font-bold uppercase tracking-wider">Upload Back Side</span>
                        <input type="file" accept="image/*" onChange={handleDocBackUpload} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-primary-500/5 border border-primary-500/10 rounded-xl text-[10px] font-medium leading-normal text-gray-400 flex items-start gap-2">
                  <FaShieldAlt className="text-primary-400 text-xs mt-0.5" />
                  <span>Your documents are stored in secure cloud systems with encrypted directories. Identification numbers are verified within our automated security ledger systems.</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-between">
                <AnimatedButton onClick={handlePrevStep} variant="secondary" className="text-xs uppercase tracking-wider py-2.5 px-6">
                  Back
                </AnimatedButton>
                <AnimatedButton onClick={handleNextStep} variant="primary" className="text-xs uppercase tracking-wider py-2.5 px-6">
                  Continue
                </AnimatedButton>
              </div>
            </GlassCard>
          )}

          {/* Step 6: Initial Trust Score & Confirmation Summary */}
          {step === 6 && (
            <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-8 space-y-6 text-center">
              <div>
                <h2 className="text-xl font-black font-display text-white tracking-tight">Onboarding Completed</h2>
                <p className="text-gray-400 text-xs mt-1">Your credentials evaluation checklist compiled.</p>
              </div>

              {/* Render Circular Animated Trust Score */}
              <div className="py-4">
                <TrustScoreCircle score={currentOnboardingScore()} size={140} />
              </div>

              <div className="max-w-md mx-auto space-y-2 bg-dark-950/60 border border-white/5 rounded-2xl p-4 text-xs font-semibold text-left">
                <div className="flex justify-between items-center text-gray-400">
                  <span>Primary Registration Verified</span>
                  <span className="text-green-400">✓ YES</span>
                </div>
                <div className="flex justify-between items-center text-gray-400">
                  <span>Photo & Biography Completed</span>
                  <span className={avatar ? 'text-green-400' : 'text-gray-500'}>{avatar ? '✓ YES' : 'SKIPPED'}</span>
                </div>
                <div className="flex justify-between items-center text-gray-400">
                  <span>Mobile Phone Number Verification</span>
                  <span className="text-green-400">✓ YES</span>
                </div>
                <div className="flex justify-between items-center text-gray-400">
                  <span>KYC Identity Files Registered</span>
                  <span className={docNumber ? 'text-green-400' : 'text-gray-500'}>{docNumber ? '✓ PENDING AUDIT' : 'SKIPPED'}</span>
                </div>
                <div className="flex justify-between items-center text-gray-400 border-t border-white/5 pt-2 mt-2">
                  <span className="text-white font-bold">Welcome Eco Reward Points</span>
                  <span className="text-primary-400 font-bold">+100 PTS</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-between">
                <AnimatedButton onClick={handlePrevStep} variant="secondary" className="text-xs uppercase tracking-wider py-2.5 px-6">
                  Back
                </AnimatedButton>
                <AnimatedButton onClick={handleCompleteOnboarding} disabled={loading} variant="primary" className="text-xs uppercase tracking-wider py-2.5 px-8 font-black">
                  {loading ? 'Completing profile...' : 'Unlock Dashboard ✨'}
                </AnimatedButton>
              </div>
            </GlassCard>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default Onboarding
