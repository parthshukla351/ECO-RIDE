import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaEnvelope, FaLock, FaKey, FaArrowLeft } from 'react-icons/fa'
import GlassCard from '../components/ui/GlassCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import api from '../services/api'
import toast from 'react-hot-toast'

const ForgotPassword = () => {
  const [step, setStep] = useState(1) // 1: Send OTP, 2: Reset Password
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSendOTP = async (e) => {
    e.preventDefault()
    if (!email) {
      toast.error('Please enter your email')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post('/auth/forgot-password', { email })
      setUserId(data.userId)
      toast.success('Password reset OTP sent to email!')
      setStep(2)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!otp || !newPassword) {
      toast.error('All fields are required')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        userId,
        otp,
        newPassword
      })
      setSuccess(true)
      toast.success('Password reset successful!')
      setTimeout(() => {
        setLoading(false)
        navigate('/login')
      }, 1500)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password reset failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <button
          onClick={() => navigate('/login')}
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-500 hover:text-white transition-colors mb-6 group cursor-pointer"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Log In
        </button>

        <GlassCard 
          hoverable={false}
          className="p-8 sm:p-10 border-white/10 shadow-2xl glow-green bg-dark-900/60"
        >
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-primary-500/10 text-primary-400 border border-primary-500/25 rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl shadow-lg">
              <FaKey />
            </div>
            <h2 className="text-white text-2xl font-black font-display tracking-tight">
              {step === 1 ? 'Forgot Password?' : 'Reset Password'}
            </h2>
            <p className="text-gray-400 mt-2 text-xs max-w-xs mx-auto leading-relaxed font-semibold">
              {step === 1 
                ? "Specify registration email to receive verification reset codes." 
                : "Specify confirmation code and new account password."
              }
            </p>
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 bg-primary-500/10 text-primary-400 border border-primary-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-lg glow-green">
                  ✓
                </div>
                <h3 className="text-2xl font-black font-display text-white">Password Reset</h3>
                <p className="text-gray-400 mt-2 text-sm leading-relaxed font-semibold">Your password has been changed. Launching login views...</p>
              </motion.div>
            ) : step === 1 ? (
              <motion.form
                key="step-1"
                onSubmit={handleSendOTP}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Email Address</label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="input-field pl-11 bg-dark-950/80 text-sm"
                    />
                  </div>
                </div>

                <AnimatedButton
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  fullWidth
                  className="py-3.5 mt-4 font-bold uppercase tracking-wider text-xs"
                >
                  {loading ? 'Sending OTP...' : 'Send Verification Code 🌱'}
                </AnimatedButton>
              </motion.form>
            ) : (
              <motion.form
                key="step-2"
                onSubmit={handleResetPassword}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {/* OTP Code */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Verification Code</label>
                  <div className="relative">
                    <FaKey className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit OTP"
                      required
                      className="input-field pl-11 bg-dark-950/80 font-mono tracking-widest text-sm"
                    />
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">New Password</label>
                  <div className="relative">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="input-field pl-11 bg-dark-950/80 text-sm"
                    />
                  </div>
                </div>

                <AnimatedButton
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  fullWidth
                  className="py-3.5 mt-4 font-bold uppercase tracking-wider text-xs"
                >
                  {loading ? 'Resetting Password...' : 'Change Password 🌱'}
                </AnimatedButton>
              </motion.form>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>
    </div>
  )
}

export default ForgotPassword
