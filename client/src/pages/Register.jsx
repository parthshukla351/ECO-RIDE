import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { FaEye, FaEyeSlash, FaUser, FaEnvelope, FaPhone, FaLock, FaGoogle, FaApple, FaDiscord } from 'react-icons/fa'
import { useAuth } from '../contexts/AuthContext'
import AuthLayout from '../components/ui/AuthLayout'
import AnimatedButton from '../components/ui/AnimatedButton'
import RoleCard from '../components/ui/RoleCard'
import PasswordStrength from '../components/ui/PasswordStrength'
import toast from 'react-hot-toast'

const Register = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [success, setSuccess] = useState(false)

  const { register: registerUser } = useAuth()
  const navigate = useNavigate()

  const { register, handleSubmit, watch, control, formState: { errors } } = useForm({
    mode: 'onTouched',
    defaultValues: {
      role: 'passenger',
      gender: 'male'
    }
  })

  const watchPassword = watch('password', '')

  const onSubmit = async (data) => {
    setLoading(true)
    setApiError('')

    try {
      const result = await registerUser(data)

      if (result.success) {
        setSuccess(true)
        toast.success('Registration successful! Check your email for OTP.')
        setTimeout(() => {
          setLoading(false)
          navigate('/verify-otp', { state: { userId: result.userId } })
        }, 1500)
      } else {
        setApiError(result.message || 'Registration failed. Please try again.')
        toast.error(result.message || 'Registration failed')
        setLoading(false)
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Server error occurred'
      setApiError(errorMsg)
      toast.error(errorMsg)
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle={
        <span>
          Already have an EcoRide ID?{' '}
          <Link to="/login" className="text-primary-400 hover:text-primary-300 font-bold transition-colors">
            Sign in
          </Link>
        </span>
      }
    >
      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div
            key="register-form-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {apiError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-4 text-xs font-semibold">
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Full Name</label>
                <div className="relative">
                  <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                  <input
                    {...register('name', { required: 'Full name is required' })}
                    type="text"
                    placeholder="John Doe"
                    className="input-field pl-11 bg-dark-950/80 text-sm"
                  />
                </div>
                {errors.name && <p className="text-red-400 text-xs mt-1 font-semibold">{errors.name.message}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Email Address</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                  <input
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                    })}
                    type="email"
                    placeholder="your@email.com"
                    className="input-field pl-11 bg-dark-950/80 text-sm"
                  />
                </div>
                {errors.email && <p className="text-red-400 text-xs mt-1 font-semibold">{errors.email.message}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Phone Number</label>
                <div className="relative">
                  <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                  <input
                    {...register('phone', { 
                      required: 'Phone number is required',
                      pattern: { value: /^[0-9]{10}$/, message: 'Must be 10 digits' }
                    })}
                    type="tel"
                    placeholder="9876543210"
                    className="input-field pl-11 bg-dark-950/80 text-sm"
                  />
                </div>
                {errors.phone && <p className="text-red-400 text-xs mt-1 font-semibold">{errors.phone.message}</p>}
              </div>

              {/* Gender */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Gender</label>
                <select
                  {...register('gender', { required: 'Gender is required' })}
                  className="input-field bg-dark-950/80 text-sm py-3 cursor-pointer"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && <p className="text-red-400 text-xs mt-1 font-semibold">{errors.gender.message}</p>}
              </div>

              {/* Role Card Select */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Join Platform As</label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <RoleCard value={field.value} onChange={field.onChange} />
                  )}
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Password</label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                  <input
                    {...register('password', { 
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Minimum 6 characters' }
                    })}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="input-field pl-11 pr-12 bg-dark-950/80 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 cursor-pointer"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1 font-semibold">{errors.password.message}</p>}

                {/* Password Strength Checklist Component */}
                <PasswordStrength value={watchPassword} />
              </div>

              <AnimatedButton
                type="submit"
                variant="primary"
                disabled={loading}
                fullWidth
                className="py-3.5 mt-4 font-bold uppercase tracking-wider text-xs"
              >
                {loading ? 'Creating Account...' : 'Create Eco Account 🌱'}
              </AnimatedButton>
            </form>

            <div className="mt-6 pt-5 border-t border-white/5 text-center">
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-3">Or sign up with</p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => toast.success('Google authentication initialization (mock interface)')}
                  className="flex items-center justify-center py-2.5 bg-white/2 hover:bg-white/5 border border-white/5 text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer"
                >
                  <FaGoogle className="text-sm" />
                </button>
                <button
                  type="button"
                  onClick={() => toast.success('Apple login initialization (mock interface)')}
                  className="flex items-center justify-center py-2.5 bg-white/2 hover:bg-white/5 border border-white/5 text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer"
                >
                  <FaApple className="text-sm" />
                </button>
                <button
                  type="button"
                  onClick={() => toast.success('Discord login initialization (mock interface)')}
                  className="flex items-center justify-center py-2.5 bg-white/2 hover:bg-white/5 border border-white/5 text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer"
                >
                  <FaDiscord className="text-sm" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="register-success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 bg-primary-500/10 text-primary-400 border border-primary-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-lg glow-green">
              ✓
            </div>
            <h3 className="text-2xl font-black font-display text-white">Registration Completed</h3>
            <p className="text-gray-400 mt-2 text-sm leading-relaxed">Dispatched verification OTP email...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  )
}

export default Register
