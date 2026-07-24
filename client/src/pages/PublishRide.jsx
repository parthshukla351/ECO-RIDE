import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { 
  FaMapMarkerAlt, FaClock, FaCar, FaUsers, FaMoneyBillWave,
  FaLeaf, FaCheckCircle, FaBolt, FaRobot
} from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'

const PublishRide = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      vehicleType: user?.vehicleDetails?.vehicleType || 'petrol',
      totalSeats: user?.vehicleDetails?.seatingCapacity || 4,
      preferences: {
        womenOnly: false,
        petsAllowed: false,
        smokingAllowed: false,
        musicAllowed: true,
        acAvailable: true,
        luggageAllowed: true
      }
    }
  })

  const [loading, setLoading] = useState(false)
  const [aiPricing, setAiPricing] = useState(null)
  const [carbonEstimate, setCarbonEstimate] = useState(null)
  const [step, setStep] = useState(1)

  const distance = watch('distance')
  const duration = watch('duration')
  const vehicleType = watch('vehicleType')
  const totalSeats = watch('totalSeats')
  const departureTime = watch('departureTime')

  // Get AI pricing suggestion
  useEffect(() => {
    if (distance && duration && departureTime) {
      getAiPricing()
      getCarbonEstimate()
    }
  }, [distance, duration, vehicleType, totalSeats, departureTime])

  const getAiPricing = async () => {
    try {
      const date = new Date(departureTime)
      const { data } = await api.post('/ai/pricing', {
        distance_km: parseFloat(distance),
        duration_min: parseFloat(duration),
        vehicle_type: vehicleType,
        total_seats: parseInt(totalSeats),
        departure_hour: date.getHours(),
        departure_day: date.getDay()
      })
      setAiPricing(data)
      if (!watch('pricePerSeat')) {
        setValue('pricePerSeat', Math.round(data.suggested_price))
      }
    } catch (error) {
      console.error('AI pricing failed:', error)
    }
  }

  const getCarbonEstimate = async () => {
    try {
      const { data } = await api.post('/ai/carbon', {
        distance_km: parseFloat(distance),
        vehicle_type: vehicleType,
        passengers: parseInt(totalSeats)
      })
      setCarbonEstimate(data)
    } catch (error) {
      console.error('Carbon calculation failed:', error)
    }
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const rideData = {
        origin: {
          address: data.originAddress,
          city: data.originCity,
          coordinates: {
            lat: parseFloat(data.originLat) || 28.6139,
            lng: parseFloat(data.originLng) || 77.2090
          }
        },
        destination: {
          address: data.destinationAddress,
          city: data.destinationCity,
          coordinates: {
            lat: parseFloat(data.destLat) || 19.0760,
            lng: parseFloat(data.destLng) || 72.8777
          }
        },
        departureTime: new Date(data.departureTime).toISOString(),
        totalSeats: parseInt(data.totalSeats),
        pricePerSeat: parseFloat(data.pricePerSeat),
        vehicleType: data.vehicleType,
        distance: parseFloat(data.distance),
        duration: parseFloat(data.duration),
        preferences: data.preferences,
        rideType: data.rideType || 'regular'
      }

      const response = await api.post('/rides/create', rideData)
      toast.success('🚗 Ride published successfully!')
      navigate('/driver/rides')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to publish ride')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-black text-white mb-2">
            Publish a New Ride 🚗
          </h1>
          <p className="text-gray-400">Share your journey and earn while going green</p>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold
                  ${step >= s 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-800 text-gray-500'
                  }`}>
                  {step > s ? <FaCheckCircle /> : s}
                </div>
                {s < 3 && (
                  <div className={`w-16 h-1 mx-2 ${step > s ? 'bg-primary-500' : 'bg-gray-800'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-16 mt-3">
            <span className={`text-sm ${step >= 1 ? 'text-white' : 'text-gray-500'}`}>Route</span>
            <span className={`text-sm ${step >= 2 ? 'text-white' : 'text-gray-500'}`}>Details</span>
            <span className={`text-sm ${step >= 3 ? 'text-white' : 'text-gray-500'}`}>Preferences</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Route Details */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card space-y-6"
            >
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaMapMarkerAlt className="text-primary-400" />
                Route Information
              </h2>

              {/* Origin */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Origin City *
                  </label>
                  <input
                    {...register('originCity', { required: 'Origin city is required' })}
                    type="text"
                    placeholder="Delhi"
                    className="input-field"
                  />
                  {errors.originCity && (
                    <p className="text-red-400 text-xs mt-1">{errors.originCity.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Origin Address *
                  </label>
                  <input
                    {...register('originAddress', { required: 'Origin address is required' })}
                    type="text"
                    placeholder="Connaught Place, New Delhi"
                    className="input-field"
                  />
                  {errors.originAddress && (
                    <p className="text-red-400 text-xs mt-1">{errors.originAddress.message}</p>
                  )}
                </div>
              </div>

              {/* Destination */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Destination City *
                  </label>
                  <input
                    {...register('destinationCity', { required: 'Destination city is required' })}
                    type="text"
                    placeholder="Mumbai"
                    className="input-field"
                  />
                  {errors.destinationCity && (
                    <p className="text-red-400 text-xs mt-1">{errors.destinationCity.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Destination Address *
                  </label>
                  <input
                    {...register('destinationAddress', { required: 'Destination address is required' })}
                    type="text"
                    placeholder="Gateway of India, Mumbai"
                    className="input-field"
                  />
                  {errors.destinationAddress && (
                    <p className="text-red-400 text-xs mt-1">{errors.destinationAddress.message}</p>
                  )}
                </div>
              </div>

              {/* Distance & Duration */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Distance (km) *
                  </label>
                  <input
                    {...register('distance', { 
                      required: 'Distance is required',
                      min: { value: 1, message: 'Minimum 1 km' }
                    })}
                    type="number"
                    step="0.1"
                    placeholder="1400"
                    className="input-field"
                  />
                  {errors.distance && (
                    <p className="text-red-400 text-xs mt-1">{errors.distance.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Duration (minutes) *
                  </label>
                  <input
                    {...register('duration', { 
                      required: 'Duration is required',
                      min: { value: 1, message: 'Minimum 1 minute' }
                    })}
                    type="number"
                    placeholder="900"
                    className="input-field"
                  />
                  {errors.duration && (
                    <p className="text-red-400 text-xs mt-1">{errors.duration.message}</p>
                  )}
                </div>
              </div>

              {carbonEstimate && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <div className="flex items-center gap-2 text-green-400 mb-2">
                    <FaLeaf />
                    <span className="font-semibold">Estimated Carbon Impact</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">CO₂ Saved</p>
                      <p className="text-white font-semibold">{carbonEstimate.carbon_saved_kg} kg</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Trees Equivalent</p>
                      <p className="text-white font-semibold">{carbonEstimate.trees_equivalent}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Eco Points</p>
                      <p className="text-white font-semibold">+{carbonEstimate.eco_points_earned}</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-primary w-full"
              >
                Next: Ride Details →
              </button>
            </motion.div>
          )}

          {/* Step 2: Ride Details */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card space-y-6"
            >
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaCar className="text-primary-400" />
                Ride Details
              </h2>

              {/* Departure Time */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Departure Date & Time *
                </label>
                <input
                  {...register('departureTime', { required: 'Departure time is required' })}
                  type="datetime-local"
                  min={new Date().toISOString().slice(0, 16)}
                  className="input-field"
                />
                {errors.departureTime && (
                  <p className="text-red-400 text-xs mt-1">{errors.departureTime.message}</p>
                )}
              </div>

              {/* Vehicle & Seats */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Vehicle Type *
                  </label>
                  <select
                    {...register('vehicleType')}
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
                    Total Seats Available *
                  </label>
                  <select
                    {...register('totalSeats')}
                    className="input-field"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n} seat{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Price Per Seat (₹) *
                </label>
                <input
                  {...register('pricePerSeat', { 
                    required: 'Price is required',
                    min: { value: 1, message: 'Minimum ₹1' }
                  })}
                  type="number"
                  placeholder="500"
                  className="input-field"
                />
                {errors.pricePerSeat && (
                  <p className="text-red-400 text-xs mt-1">{errors.pricePerSeat.message}</p>
                )}
                
                {aiPricing && (
                  <div className="mt-3 p-3 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-primary-400 text-sm mb-2">
                      <FaRobot />
                      <span className="font-semibold">AI Pricing Suggestion</span>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <div>
                        <span className="text-gray-400">Suggested: </span>
                        <span className="text-white font-semibold">₹{Math.round(aiPricing.suggested_price)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Range: </span>
                        <span className="text-white">
                          ₹{Math.round(aiPricing.min_price)} - ₹{Math.round(aiPricing.max_price)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Demand: </span>
                        <span className="text-white">{aiPricing.demand_factor}x</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Ride Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ride Type
                </label>
                <select
                  {...register('rideType')}
                  className="input-field"
                >
                  <option value="regular">Regular Ride</option>
                  <option value="women_only">Women Only</option>
                  <option value="student">Student Ride</option>
                  <option value="office">Office Commute</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-outline flex-1"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="btn-primary flex-1"
                >
                  Next: Preferences →
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card space-y-6"
            >
              <h2 className="text-xl font-bold text-white">
                Ride Preferences
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { name: 'womenOnly', label: 'Women Only Ride', icon: '👩' },
                  { name: 'petsAllowed', label: 'Pets Allowed', icon: '🐕' },
                  { name: 'smokingAllowed', label: 'Smoking Allowed', icon: '🚬' },
                  { name: 'musicAllowed', label: 'Music Allowed', icon: '🎵' },
                  { name: 'acAvailable', label: 'AC Available', icon: '❄️' },
                  { name: 'luggageAllowed', label: 'Luggage Allowed', icon: '🧳' }
                ].map(pref => (
                  <label
                    key={pref.name}
                    className="flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl cursor-pointer border border-gray-700 hover:border-primary-500/50 transition-all"
                  >
                    <input
                      {...register(`preferences.${pref.name}`)}
                      type="checkbox"
                      className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-2xl">{pref.icon}</span>
                    <span className="text-white">{pref.label}</span>
                  </label>
                ))}
              </div>

              {/* Summary */}
              <div className="p-6 bg-gradient-to-br from-primary-900/20 to-emerald-900/20 border border-primary-500/30 rounded-xl">
                <h3 className="text-white font-bold mb-4">Ride Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Route:</span>
                    <span className="text-white font-medium">
                      {watch('originCity')} → {watch('destinationCity')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Distance:</span>
                    <span className="text-white">{watch('distance')} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Departure:</span>
                    <span className="text-white">
                      {watch('departureTime') && new Date(watch('departureTime')).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price per seat:</span>
                    <span className="text-primary-400 font-semibold">₹{watch('pricePerSeat')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total seats:</span>
                    <span className="text-white">{watch('totalSeats')}</span>
                  </div>
                  {carbonEstimate && (
                    <div className="flex justify-between pt-2 border-t border-gray-700">
                      <span className="text-gray-400">CO₂ to save:</span>
                      <span className="text-green-400 font-semibold">
                        {carbonEstimate.carbon_saved_kg} kg
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-outline flex-1"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Publishing...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle /> Publish Ride
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </form>
      </div>
    </div>
  )
}

export default PublishRide