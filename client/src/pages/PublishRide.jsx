import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { 
  FaMapMarkerAlt, FaClock, FaCar, FaUsers, FaMoneyBillWave,
  FaLeaf, FaCheckCircle, FaBolt, FaRobot
} from 'react-icons/fa'
import { useAuth } from '../contexts/AuthContext'
import GlassCard from '../components/ui/GlassCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import api from '../services/api'
import toast from 'react-hot-toast'

// Maps integration imports
import MapView from '../components/map/MapView'
import LocationSearch from '../components/map/LocationSearch'
import LocationPermissionPrompt from '../components/map/LocationPermissionPrompt'
import { useGeolocation } from '../hooks/useGeolocation'

const PublishRide = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      vehicleType: user?.vehicleDetails?.vehicleType || 'petrol',
      totalSeats: user?.vehicleDetails?.seatingCapacity || 4,
      departureDate: new Date().toISOString().slice(0, 10),
      departureTimeOnly: new Date().toTimeString().slice(0, 5),
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
  const departureDate = watch('departureDate')
  const departureTimeOnly = watch('departureTimeOnly')

  // Location watches & geolocation states
  const originLat = watch('originLat')
  const originLng = watch('originLng')
  const destLat = watch('destLat')
  const destLng = watch('destLng')
  const originAddress = watch('originAddress')
  const originCity = watch('originCity')
  const destinationAddress = watch('destinationAddress')
  const destinationCity = watch('destinationCity')

  const { coordinates: userCoords, permissionState, getLocation } = useGeolocation()

  // Register coordinate fields with react-hook-form on load
  useEffect(() => {
    register('originLat', { required: 'Origin latitude is required' })
    register('originLng', { required: 'Origin longitude is required' })
    register('destLat', { required: 'Destination latitude is required' })
    register('destLng', { required: 'Destination longitude is required' })
    register('routePolyline')
  }, [register])

  useEffect(() => {
    getLocation()
  }, [getLocation])

  // Get AI pricing suggestion
  useEffect(() => {
    if (distance && duration && departureDate && departureTimeOnly) {
      getAiPricing()
      getCarbonEstimate()
    }
  }, [distance, duration, vehicleType, totalSeats, departureDate, departureTimeOnly])

  const getAiPricing = async () => {
    try {
      const date = new Date(departureDate + 'T' + departureTimeOnly)
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

  const handleUseCurrentLocation = async () => {
    if (!userCoords) {
      getLocation()
      return
    }

    setValue('originLat', userCoords.lat)
    setValue('originLng', userCoords.lng)
    setValue('originCity', 'Current City')
    setValue('originAddress', 'Current Location')

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userCoords.lat}&lon=${userCoords.lng}`, {
        headers: { 'User-Agent': 'EcoRide-App-Phase2' }
      })
      if (res.ok) {
        const data = await res.json()
        const city = data.address?.city || data.address?.town || data.address?.state || 'Current Location'
        setValue('originCity', city)
        setValue('originAddress', data.display_name || 'My Location')
      }
    } catch (err) {
      console.warn('Reverse geocoding error:', err)
    }
  }

  const handleRouteCalculated = useCallback(({ distance: dist, duration: dur, routePolyline }) => {
    setValue('distance', parseFloat(dist))
    setValue('duration', parseInt(dur))
    if (routePolyline) {
      setValue('routePolyline', routePolyline)
    }
  }, [setValue])

  const mapOrigin = originLat && originLng ? {
    address: originAddress,
    city: originCity,
    coordinates: { lat: originLat, lng: originLng }
  } : null

  const mapDestination = destLat && destLng ? {
    address: destinationAddress,
    city: destinationCity,
    coordinates: { lat: destLat, lng: destLng }
  } : null

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
        departureTime: new Date(data.departureDate + 'T' + data.departureTimeOnly).toISOString(),
        totalSeats: parseInt(data.totalSeats),
        pricePerSeat: parseFloat(data.pricePerSeat),
        vehicleType: data.vehicleType,
        distance: parseFloat(data.distance),
        duration: parseFloat(data.duration),
        preferences: data.preferences,
        rideType: data.rideType || 'regular',
        routePolyline: data.routePolyline
      }

      await api.post('/rides/create', rideData)
      toast.success('🚗 Ride published successfully!')
      navigate('/driver/rides')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to publish ride')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 pb-12 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center sm:text-left"
      >
        <h1 className="text-3xl font-black font-display text-white tracking-tight">
          Publish a New Ride 🚗
        </h1>
        <p className="text-gray-400 text-sm font-medium mt-1">Share your journey, cut expenses, and earn carbon offset points.</p>
      </motion.div>

      {/* Progress Steps */}
      <div className="mb-6">
        <div className="flex items-center justify-center gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border transition-all
                ${step >= s 
                  ? 'bg-primary-500 text-white border-primary-500/20 shadow-md shadow-primary-500/10' 
                  : 'bg-dark-900 border-white/5 text-gray-500'
                }`}>
                {step > s ? <FaCheckCircle /> : s}
              </div>
              {s < 3 && (
                <div className={`w-12 sm:w-20 h-[2px] ${step > s ? 'bg-primary-500' : 'bg-white/5'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-12 sm:gap-24 mt-2 text-[10px] font-black uppercase tracking-wider text-gray-500">
          <span className={step >= 1 ? 'text-primary-400' : ''}>Route</span>
          <span className={step >= 2 ? 'text-primary-400' : ''}>Details</span>
          <span className={step >= 3 ? 'text-primary-400' : ''}>Preferences</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Route Details */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <GlassCard hoverable={false} className="space-y-6 border-white/5 bg-dark-900/40 p-6 sm:p-8">
              <h3 className="text-lg font-bold text-white font-display flex items-center gap-2 mb-2">
                <FaMapMarkerAlt className="text-primary-400 text-sm" />
                Route Information
              </h3>

              <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* Inputs & fallback tools */}
                <div className="space-y-5">
                  <LocationPermissionPrompt
                    permissionState={permissionState}
                    requestLocation={getLocation}
                    onManualSelect={() => {}}
                  />

                  {permissionState === 'granted' && (
                    <AnimatedButton
                      type="button"
                      variant="secondary"
                      onClick={handleUseCurrentLocation}
                      className="w-full py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 justify-center"
                    >
                      <FaMapMarkerAlt className="text-primary-400 text-sm" /> Use Current Location
                    </AnimatedButton>
                  )}

                  {/* Origin */}
                  <LocationSearch
                    label="Origin Address *"
                    placeholder="Search pickup point..."
                    value={originAddress}
                    onChange={(val) => setValue('originAddress', val)}
                    onSelectLocation={(loc) => {
                      setValue('originAddress', loc.address)
                      setValue('originCity', loc.city)
                      setValue('originLat', loc.coordinates.lat)
                      setValue('originLng', loc.coordinates.lng)
                    }}
                  />
                  {errors.originAddress && <p className="text-red-400 text-xs">{errors.originAddress.message}</p>}

                  {/* Destination */}
                  <LocationSearch
                    label="Destination Address *"
                    placeholder="Search destination drop-off..."
                    value={destinationAddress}
                    onChange={(val) => setValue('destinationAddress', val)}
                    onSelectLocation={(loc) => {
                      setValue('destinationAddress', loc.address)
                      setValue('destinationCity', loc.city)
                      setValue('destLat', loc.coordinates.lat)
                      setValue('destLng', loc.coordinates.lng)
                    }}
                  />
                  {errors.destinationAddress && <p className="text-red-400 text-xs">{errors.destinationAddress.message}</p>}

                  {/* Distance & Duration Displays */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Distance (km)</label>
                      <input
                        {...register('distance', { required: 'Distance is required' })}
                        type="number"
                        step="0.1"
                        readOnly
                        placeholder="Pending route..."
                        className="input-field bg-dark-950/45 text-sm border-white/5 text-gray-400 select-none pointer-events-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Duration (mins)</label>
                      <input
                        {...register('duration', { required: 'Duration is required' })}
                        type="number"
                        readOnly
                        placeholder="Pending route..."
                        className="input-field bg-dark-950/45 text-sm border-white/5 text-gray-400 select-none pointer-events-none"
                      />
                    </div>
                  </div>

                  {carbonEstimate && (
                    <div className="p-4 bg-green-500/10 border border-green-500/25 rounded-2xl space-y-2">
                      <div className="flex items-center gap-1.5 text-green-400 text-xs font-black uppercase tracking-wider">
                        <FaLeaf />
                        <span>Estimated Environmental Impact</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-gray-500 font-bold">CO₂ Saved</p>
                          <p className="text-white font-black font-display text-sm mt-0.5">{carbonEstimate.carbon_saved_kg} kg</p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-bold">Trees Equal</p>
                          <p className="text-white font-black font-display text-sm mt-0.5">{carbonEstimate.trees_equivalent}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-bold">Eco Points</p>
                          <p className="text-white font-black font-display text-sm mt-0.5">+{carbonEstimate.eco_points_earned}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Map View */}
                <div className="h-[300px] lg:h-[380px] w-full">
                  <MapView
                    origin={mapOrigin}
                    destination={mapDestination}
                    currentLocation={userCoords}
                    height="100%"
                    showRoute={true}
                    interactive={true}
                    onRouteCalculated={handleRouteCalculated}
                  />
                </div>
              </div>
            </GlassCard>

            <AnimatedButton
              type="button"
              variant="primary"
              fullWidth
              onClick={async () => {
                let resolvedOriginLat = originLat
                let resolvedOriginLng = originLng
                let resolvedDestLat = destLat
                let resolvedDestLng = destLng

                if (!originAddress || !destinationAddress) {
                  toast.error('Please enter both origin and destination addresses.')
                  return
                }

                // If origin coordinates are missing, resolve them now
                if (!resolvedOriginLat || !resolvedOriginLng) {
                  const toastId = toast.loading('Geocoding origin address...')
                  try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(originAddress)}&countrycodes=in&limit=1`, {
                      headers: { 'User-Agent': 'EcoRide-App-Phase2' }
                    })
                    if (res.ok) {
                      const data = await res.json()
                      if (data && data[0]) {
                        resolvedOriginLat = parseFloat(data[0].lat)
                        resolvedOriginLng = parseFloat(data[0].lon)
                        setValue('originLat', resolvedOriginLat)
                        setValue('originLng', resolvedOriginLng)
                        const city = data[0].address?.city || data[0].address?.town || data[0].address?.state || data[0].display_name.split(',')[0].trim()
                        setValue('originCity', city)
                        toast.success('Origin address resolved! 📍', { id: toastId })
                      } else {
                        // Local presets fallback
                        const cleanOrigin = originAddress.trim().toLowerCase()
                        const LOCAL_PRESETS = {
                          'prayagraj': { lat: 25.4372, lng: 81.8463 },
                          'allahabad': { lat: 25.4372, lng: 81.8463 },
                          'lucknow': { lat: 26.8467, lng: 80.9462 },
                          'lalgopalganj': { lat: 25.7533, lng: 81.6367 },
                          'kunda': { lat: 25.7208, lng: 81.5167 },
                          'delhi': { lat: 28.6139, lng: 77.2090 },
                          'jaipur': { lat: 26.9124, lng: 75.7873 },
                          'kanpur': { lat: 26.4499, lng: 80.3319 },
                          'pune': { lat: 18.5204, lng: 73.8567 }
                        }
                        const foundPreset = Object.keys(LOCAL_PRESETS).find(k => cleanOrigin.includes(k))
                        if (foundPreset) {
                          resolvedOriginLat = LOCAL_PRESETS[foundPreset].lat
                          resolvedOriginLng = LOCAL_PRESETS[foundPreset].lng
                          setValue('originLat', resolvedOriginLat)
                          setValue('originLng', resolvedOriginLng)
                          setValue('originCity', originAddress)
                          toast.success('Origin address resolved (offline fallback)! 📍', { id: toastId })
                        } else {
                          toast.error('Could not resolve origin address coordinates.', { id: toastId })
                        }
                      }
                    } else {
                      toast.error('Geocoding server error.', { id: toastId })
                    }
                  } catch (err) {
                    toast.error('Failed to geocode origin.', { id: toastId })
                  }
                }

                // If destination coordinates are missing, resolve them now
                if (!resolvedDestLat || !resolvedDestLng) {
                  const toastId = toast.loading('Geocoding destination address...')
                  try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(destinationAddress)}&countrycodes=in&limit=1`, {
                      headers: { 'User-Agent': 'EcoRide-App-Phase2' }
                    })
                    if (res.ok) {
                      const data = await res.json()
                      if (data && data[0]) {
                        resolvedDestLat = parseFloat(data[0].lat)
                        resolvedDestLng = parseFloat(data[0].lon)
                        setValue('destLat', resolvedDestLat)
                        setValue('destLng', resolvedDestLng)
                        const city = data[0].address?.city || data[0].address?.town || data[0].address?.state || data[0].display_name.split(',')[0].trim()
                        setValue('destinationCity', city)
                        toast.success('Destination address resolved! 📍', { id: toastId })
                      } else {
                        // Local presets fallback
                        const cleanDest = destinationAddress.trim().toLowerCase()
                        const LOCAL_PRESETS = {
                          'prayagraj': { lat: 25.4372, lng: 81.8463 },
                          'allahabad': { lat: 25.4372, lng: 81.8463 },
                          'lucknow': { lat: 26.8467, lng: 80.9462 },
                          'lalgopalganj': { lat: 25.7533, lng: 81.6367 },
                          'kunda': { lat: 25.7208, lng: 81.5167 },
                          'delhi': { lat: 28.6139, lng: 77.2090 },
                          'jaipur': { lat: 26.9124, lng: 75.7873 },
                          'kanpur': { lat: 26.4499, lng: 80.3319 },
                          'pune': { lat: 18.5204, lng: 73.8567 }
                        }
                        const foundPreset = Object.keys(LOCAL_PRESETS).find(k => cleanDest.includes(k))
                        if (foundPreset) {
                          resolvedDestLat = LOCAL_PRESETS[foundPreset].lat
                          resolvedDestLng = LOCAL_PRESETS[foundPreset].lng
                          setValue('destLat', resolvedDestLat)
                          setValue('destLng', resolvedDestLng)
                          setValue('destinationCity', destinationAddress)
                          toast.success('Destination address resolved (offline fallback)! 📍', { id: toastId })
                        } else {
                          toast.error('Could not resolve destination address coordinates.', { id: toastId })
                        }
                      }
                    } else {
                      toast.error('Geocoding server error.', { id: toastId })
                    }
                  } catch (err) {
                    toast.error('Failed to geocode destination.', { id: toastId })
                  }
                }

                // Wait a brief moment for coordinates to populate and OSRM routing to trigger
                if (resolvedOriginLat && resolvedDestLat) {
                  const toastId = toast.loading('Calculating route & pricing...')
                  setTimeout(() => {
                    toast.dismiss(toastId)
                    setStep(2)
                  }, 1200)
                } else {
                  toast.error('Please select valid locations with coordinates before proceeding.')
                }
              }}
              className="py-3.5 text-xs font-black uppercase tracking-wider"
            >
              Next: Ride Details →
            </AnimatedButton>
          </motion.div>
        )}

        {/* Step 2: Ride Details */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <GlassCard hoverable={false} className="space-y-6 border-white/5 bg-dark-900/40">
              <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                <FaCar className="text-primary-400 text-sm" />
                Ride Details
              </h3>

              {/* Departure Date */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Departure Date *</label>
                <input
                  {...register('departureDate', { required: 'Departure date is required' })}
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  className="input-field bg-dark-950/80 text-sm"
                />
                {errors.departureDate && <p className="text-red-400 text-xs">{errors.departureDate.message}</p>}
              </div>

              {/* Departure Time */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Departure Time *</label>
                <input
                  {...register('departureTimeOnly', { required: 'Departure time is required' })}
                  type="time"
                  className="input-field bg-dark-950/80 text-sm"
                />
                {errors.departureTimeOnly && <p className="text-red-400 text-xs">{errors.departureTimeOnly.message}</p>}
              </div>

              {/* Vehicle & Seats */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Vehicle Type *</label>
                  <select
                    {...register('vehicleType')}
                    className="input-field bg-dark-950/80 text-sm cursor-pointer py-3"
                  >
                    <option value="petrol">⛽ Petrol</option>
                    <option value="diesel">🛢️ Diesel</option>
                    <option value="hybrid">🔋 Hybrid</option>
                    <option value="electric">⚡ Electric</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Available Seats *</label>
                  <select
                    {...register('totalSeats')}
                    className="input-field bg-dark-950/80 text-sm cursor-pointer py-3"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n} seat{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Price Per Seat (₹) *</label>
                <input
                  {...register('pricePerSeat', { 
                    required: 'Price is required',
                    min: { value: 1, message: 'Minimum ₹1' }
                  })}
                  type="number"
                  placeholder="500"
                  className="input-field bg-dark-950/80 text-sm"
                />
                {errors.pricePerSeat && <p className="text-red-400 text-xs">{errors.pricePerSeat.message}</p>}
                
                {aiPricing && (
                  <div className="mt-3 p-4 bg-primary-500/10 border border-primary-500/25 rounded-2xl space-y-2">
                    <div className="flex items-center gap-1.5 text-primary-400 text-xs font-black uppercase tracking-wider">
                      <FaRobot />
                      <span>AI Pricing Suggestion</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500 font-bold">Suggested</p>
                        <p className="text-white font-black font-display text-sm mt-0.5">₹{Math.round(aiPricing.suggested_price)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-bold">Range</p>
                        <p className="text-white font-medium text-[11px] mt-1">₹{Math.round(aiPricing.min_price)} - ₹{Math.round(aiPricing.max_price)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-bold">Demand factor</p>
                        <p className="text-white font-black font-display text-sm mt-0.5">{aiPricing.demand_factor}x</p>
                      </div>
                    </div>
                  </div>
                )}

                {watch('pricePerSeat') && (
                  <div className="mt-4 p-4 bg-dark-950/60 border border-white/5 rounded-2xl space-y-3">
                    <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                      💰 Segment & Total Fare Breakdown (Estimated)
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-gray-400 font-semibold">
                        <span>Passenger Fare Share (Per Seat):</span>
                        <span className="text-white font-bold">₹{parseInt(watch('pricePerSeat'))}</span>
                      </div>
                      <div className="flex justify-between text-gray-400 font-semibold">
                        <span>Platform / Service Fee:</span>
                        <span className="text-white">+₹15</span>
                      </div>
                      {watch('vehicleType') === 'electric' || watch('vehicleType') === 'hybrid' ? (
                        <div className="flex justify-between text-green-400 font-semibold">
                          <span>Eco-Vehicle Discount:</span>
                          <span>-₹{Math.round(parseInt(watch('pricePerSeat')) * 0.1)}</span>
                        </div>
                      ) : null}
                      <div className="flex justify-between text-gray-400 font-semibold">
                        <span>Estimated Taxes (5% GST):</span>
                        <span className="text-white">
                          +₹{Math.round(
                            (parseInt(watch('pricePerSeat')) + 15 - 
                            (watch('vehicleType') === 'electric' || watch('vehicleType') === 'hybrid' ? Math.round(parseInt(watch('pricePerSeat')) * 0.1) : 0)) * 0.05
                          )}
                        </span>
                      </div>
                      <div className="border-t border-white/5 my-2"></div>
                      <div className="flex justify-between text-gray-400 font-bold">
                        <span>Passenger Share (Per Seat):</span>
                        <span className="text-primary-400 font-black">
                          ₹{parseInt(watch('pricePerSeat')) + 15 +
                            Math.round(
                              (parseInt(watch('pricePerSeat')) + 15 - 
                              (watch('vehicleType') === 'electric' || watch('vehicleType') === 'hybrid' ? Math.round(parseInt(watch('pricePerSeat')) * 0.1) : 0)) * 0.05
                            ) - (watch('vehicleType') === 'electric' || watch('vehicleType') === 'hybrid' ? Math.round(parseInt(watch('pricePerSeat')) * 0.1) : 0)
                          }
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-400 font-bold">
                        <span>Driver Earning (Per Seat):</span>
                        <span className="text-emerald-400 font-black">₹{parseInt(watch('pricePerSeat'))}</span>
                      </div>
                      <div className="flex justify-between text-gray-400 font-bold">
                        <span>TOTAL RIDE VALUE (Capacity: {totalSeats} Seats):</span>
                        <span className="text-cyan-400 font-black">₹{parseInt(watch('pricePerSeat')) * parseInt(totalSeats)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Ride Type */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Ride Category</label>
                <select
                  {...register('rideType')}
                  className="input-field bg-dark-950/80 text-sm cursor-pointer py-3"
                >
                  <option value="regular">Regular Share</option>
                  <option value="women_only">Women Only Share</option>
                  <option value="student">Student Share</option>
                  <option value="office">Office Commute Share</option>
                </select>
              </div>
            </GlassCard>

            <div className="flex gap-3">
              <AnimatedButton
                type="button"
                variant="secondary"
                onClick={() => setStep(1)}
                className="flex-1 py-3.5 text-xs font-black uppercase tracking-wider"
              >
                ← Back
              </AnimatedButton>
              <AnimatedButton
                type="button"
                variant="primary"
                onClick={() => setStep(3)}
                className="flex-1 py-3.5 text-xs font-black uppercase tracking-wider"
              >
                Next: Preferences →
              </AnimatedButton>
            </div>
          </motion.div>
        )}

        {/* Step 3: Preferences */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <GlassCard hoverable={false} className="space-y-6 border-white/5 bg-dark-900/40">
              <h3 className="text-lg font-bold text-white font-display">Ride Preferences</h3>

              <div className="grid md:grid-cols-2 gap-3">
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
                    className="flex items-center gap-3 p-4 bg-dark-950/50 hover:bg-dark-950/80 rounded-xl cursor-pointer border border-white/5 hover:border-primary-500/20 transition-all"
                  >
                    <input
                      {...register(`preferences.${pref.name}`)}
                      type="checkbox"
                      className="w-4 h-4 rounded border-white/10 bg-dark-900 text-primary-500 focus:ring-primary-500 cursor-pointer"
                    />
                    <span className="text-xl">{pref.icon}</span>
                    <span className="text-white text-xs font-bold uppercase tracking-wider">{pref.label}</span>
                  </label>
                ))}
              </div>

              {/* Ride Summary block */}
              <div className="p-5 bg-gradient-to-br from-primary-900/10 to-emerald-900/5 border border-primary-500/20 rounded-2xl space-y-2.5 text-xs font-semibold">
                <h4 className="text-white font-bold font-display text-sm">Ride Summary</h4>
                <div className="space-y-2 border-t border-white/5 pt-2 text-gray-400">
                  <div className="flex justify-between">
                    <span>Route</span>
                    <span className="text-white font-bold">{watch('originCity')} → {watch('destinationCity')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Distance</span>
                    <span className="text-white font-bold">{watch('distance')} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Departure Time</span>
                    <span className="text-white font-bold">
                      {watch('departureTime') && new Date(watch('departureTime')).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pricing seat</span>
                    <span className="text-primary-400 font-bold">₹{watch('pricePerSeat')}</span>
                  </div>
                  {carbonEstimate && (
                    <div className="flex justify-between pt-2 border-t border-white/5 text-green-400">
                      <span>Total Carbon Offset</span>
                      <span className="font-bold">{carbonEstimate.carbon_saved_kg} kg CO₂</span>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>

            <div className="flex gap-3">
              <AnimatedButton
                type="button"
                variant="secondary"
                onClick={() => setStep(2)}
                className="flex-1 py-3.5 text-xs font-black uppercase tracking-wider"
              >
                ← Back
              </AnimatedButton>
              <AnimatedButton
                type="submit"
                variant="primary"
                disabled={loading}
                className="flex-1 py-3.5 text-xs font-black uppercase tracking-wider"
              >
                {loading ? 'Publishing Ride...' : 'Publish Ride 🌱'}
              </AnimatedButton>
            </div>
          </motion.div>
        )}
      </form>
    </div>
  )
}

export default PublishRide
