import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa'
import { useAuth } from '../contexts/AuthContext'
import GlassCard from '../components/ui/GlassCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import OTPInput from '../components/ui/OTPInput'
import api from '../services/api'
import toast from 'react-hot-toast'

const VerifyOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [countdown, setCountdown] = useState(60)
  
  const { verifyOTP } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const userId = location.state?.userId

  useEffect(() => {
    if (!userId) {
      navigate('/register')
      return
    }
    
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [userId, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const otpString = otp.join('')
    if (otpString.length !== 6) {
      toast.error('Please enter all 6 digits')
      return
    }

    setLoading(true)
    const result = await verifyOTP(userId, otpString)
    
    if (result.success) {
      setSuccess(true)
      setTimeout(() => {
        setLoading(false)
        // Redirect newly verified users to onboarding to complete profile KYC!
        navigate('/onboarding')
      }, 1500)
    } else {
      setLoading(false)
    }
  }

  // Auto trigger verification once all 6 digits are filled
  useEffect(() => {
    const otpString = otp.join('')
    if (otpString.length === 6 && !loading && !success) {
      const pseudoEvent = { preventDefault: () => {} }
      handleSubmit(pseudoEvent)
    }
  }, [otp])

  const handleResend = async () => {
    if (countdown > 0) return
    setResendLoading(true)
    try {
      await api.post('/auth/resend-otp', { userId })
      toast.success('A new OTP has been sent to your email!')
      setCountdown(60)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center py-12 relative overflow-hidden">
      {/* Decorative Blob */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-primary-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <button
          onClick={() => navigate('/register')}
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-500 hover:text-white transition-colors mb-6 group cursor-pointer"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Register
        </button>

        <GlassCard 
          hoverable={false}
          className="p-8 sm:p-10 border-white/10 shadow-2xl glow-green bg-dark-900/60"
        >
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-primary-500/10 text-primary-400 border border-primary-500/25 rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl shadow-lg">
              <FaEnvelope />
            </div>
            <h2 className="text-white text-2xl font-black font-display tracking-tight">Verify Your Email</h2>
            <p className="text-gray-400 mt-2 text-xs max-w-xs mx-auto leading-relaxed font-semibold">
              We have dispatched a 6-digit confirmation passcode to your email.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!success ? (
              <motion.div
                key="otp-form-wrapper"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <form onSubmit={handleSubmit}>
                  {/* Reuse high-fidelity OTPInput component */}
                  <OTPInput value={otp} onChange={setOtp} />

                  <AnimatedButton
                    type="submit"
                    variant="primary"
                    disabled={loading || otp.join('').length !== 6}
                    fullWidth
                    className="py-3.5 font-bold uppercase tracking-wider text-xs"
                  >
                    {loading ? 'Verifying Code...' : 'Verify Code 🌱'}
                  </AnimatedButton>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-gray-500 text-xs font-semibold">
                    Didn't receive the OTP?{' '}
                    {countdown > 0 ? (
                      <span className="text-primary-400 font-bold">Resend in {countdown}s</span>
                    ) : (
                      <button
                        onClick={handleResend}
                        disabled={resendLoading}
                        className="text-primary-400 hover:text-primary-300 font-bold underline cursor-pointer bg-transparent border-none p-0 outline-none"
                      >
                        {resendLoading ? 'Sending...' : 'Resend Code'}
                      </button>
                    )}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="otp-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 bg-primary-500/10 text-primary-400 border border-primary-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-lg glow-green animate-pulse">
                  ✓
                </div>
                <h3 className="text-2xl font-black font-display text-white">Email Verified!</h3>
                <p className="text-gray-400 mt-2 text-sm leading-relaxed">Verification complete. Launching onboarding profiles...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>
    </div>
  )
}

export default VerifyOTP
