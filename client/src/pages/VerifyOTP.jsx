import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaEnvelope } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'

const VerifyOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const inputRefs = useRef([])
  const { verifyOTP } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const userId = location.state?.userId

  useEffect(() => {
    if (!userId) navigate('/register')
    inputRefs.current[0]?.focus()
    
    const timer = setInterval(() => {
      setCountdown(prev => prev > 0 ? prev - 1 : 0)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleChange = (index, value) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const otpString = otp.join('')
    if (otpString.length !== 6) {
      toast.error('Please enter all 6 digits')
      return
    }

    setLoading(true)
    const result = await verifyOTP(userId, otpString)
    setLoading(false)

    if (result.success) navigate('/dashboard')
  }

  const handleResend = async () => {
    if (countdown > 0) return
    setResendLoading(true)
    try {
      await api.post('/auth/resend-otp', { userId })
      toast.success('OTP resent!')
      setCountdown(60)
    } catch {
      toast.error('Failed to resend OTP')
    }
    setResendLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FaEnvelope className="text-primary-600 text-2xl" />
          </div>
          <h2 className="text-gray-900 text-2xl font-bold">Verify Your Email</h2>
          <p className="text-gray-500 mt-2">We sent a 6-digit OTP to your email</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit}>
            {/* OTP Inputs */}
            <div className="flex gap-3 justify-center mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(index, e.target.value.replace(/\D/, ''))}
                  onKeyDown={e => handleKeyDown(index, e)}
                  className={`w-12 h-12 text-center text-xl font-bold rounded-xl border-2 
                    bg-gray-50 text-gray-900 transition-all
                    ${digit ? 'border-primary-500' : 'border-gray-200'}
                    focus:outline-none focus:border-primary-400`}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-4 rounded-2xl transition-all mt-6 flex items-center justify-center gap-2 text-lg shadow-md"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verifying...
                </>
              ) : (
                'Verify OTP 🌱'
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-gray-600 text-sm">
              Didn't receive OTP?{' '}
              {countdown > 0 ? (
                <span className="text-gray-400">Resend in {countdown}s</span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="text-primary-600 hover:text-primary-500 font-medium"
                >
                  {resendLoading ? 'Sending...' : 'Resend OTP'}
                </button>
              )}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default VerifyOTP