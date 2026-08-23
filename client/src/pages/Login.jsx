import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaGoogle, FaApple, FaDiscord } from 'react-icons/fa'
import { useAuth } from '../contexts/AuthContext'
import AuthLayout from '../components/ui/AuthLayout'
import AnimatedButton from '../components/ui/AnimatedButton'

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const { register, handleSubmit, formState: { errors } } = useForm({
    mode: 'onTouched'
  })

  const onSubmit = async (data) => {
    setLoading(true)
    const result = await login(data.email, data.password)
    
    if (result.needsVerification) {
      setLoading(false)
      navigate('/verify-otp', { state: { userId: result.userId } })
    } else if (result.success) {
      setLoginSuccess(true)
      setTimeout(() => {
        setLoading(false)
        const dashboardPath = result.user.role === 'driver' ? '/driver/dashboard'
                            : result.user.role === 'admin' ? '/admin'
                            : '/dashboard'
        // If the user profile is incomplete, redirect them to onboarding stepper!
        const profileIncomplete = !result.user.profileCompleted
        navigate(profileIncomplete ? '/onboarding' : (from === '/' ? dashboardPath : from))
      }, 1500)
    } else {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle={
        <span>
          New to EcoRide?{' '}
          <Link to="/register" className="text-primary-400 hover:text-primary-300 font-bold transition-colors">
            Create an account
          </Link>
        </span>
      }
    >
      <AnimatePresence mode="wait">
        {!loginSuccess ? (
          <motion.div
            key="login-form-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Email Address</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                  <input
                    {...register('email', {
                      required: 'Email address is required',
                      pattern: { value: /^\S+@\S+$/i, message: 'Please enter a valid email address' }
                    })}
                    type="email"
                    placeholder="your@email.com"
                    className="input-field pl-11 bg-dark-950/80 text-sm"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1 font-semibold">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Password</label>
                  <Link to="/forgot-password" className="text-[10px] text-primary-400 hover:text-primary-300 font-bold uppercase tracking-wider transition-colors">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                  <input
                    {...register('password', { required: 'Password is required' })}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="input-field pl-11 pr-12 bg-dark-950/80 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-xs mt-1 font-semibold">{errors.password.message}</p>
                )}
              </div>

              {/* Submit button */}
              <AnimatedButton
                type="submit"
                variant="primary"
                disabled={loading}
                fullWidth
                className="py-3.5 mt-2 font-bold uppercase tracking-wider text-xs"
              >
                {loading ? 'Verifying Session...' : 'Sign In 🌱'}
              </AnimatedButton>
            </form>

            {/* Social logins */}
            <div className="mt-6 pt-5 border-t border-white/5 text-center">
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-3">Or sign in with</p>
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
            key="login-success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 bg-primary-500/10 text-primary-400 border border-primary-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-lg glow-green">
              ✓
            </div>
            <h3 className="text-2xl font-black font-display text-white">Login Successful</h3>
            <p className="text-gray-400 mt-2 text-sm leading-relaxed">Synchronizing your dashboard views...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  )
}

export default Login
