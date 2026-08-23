import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FaCreditCard, FaWallet, FaGoogle, FaRoute, FaUser, 
  FaUsers, FaLeaf, FaClock, FaCheckCircle, FaExclamationTriangle,
  FaArrowLeft, FaReceipt
} from 'react-icons/fa'
import { useAuth } from '../contexts/AuthContext'
import GlassCard from '../components/ui/GlassCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import paymentService from '../services/paymentService'
import api from '../services/api'
import toast from 'react-hot-toast'

const Checkout = () => {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [booking, setBooking] = useState(null)
  const [fareBreakdown, setFareBreakdown] = useState(null)
  const [walletInfo, setWalletInfo] = useState(null)
  const [selectedMethod, setSelectedMethod] = useState('razorpay') // 'razorpay', 'googlepay', 'wallet'
  
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [success, setSuccess] = useState(false)

  // 1. Inject Razorpay Script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)

    fetchDetails()

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [bookingId])

  const fetchDetails = async () => {
    setLoading(true)
    try {
      // Fetch booking, fare breakdown, and wallet info
      const [bookingRes, walletData] = await Promise.all([
        api.get(`/bookings/${bookingId}`),
        paymentService.getWalletInfo()
      ])

      setBooking(bookingRes.data.booking)
      setWalletInfo(walletData)

      // Get authoritative breakdown
      const fare = await paymentService.calculateFare(bookingId)
      setFareBreakdown(fare)
    } catch (error) {
      toast.error('Failed to load checkout details')
      navigate('/bookings')
    } finally {
      setLoading(false)
    }
  }

  // 2. Handle Booking payment
  const handlePayment = async () => {
    if (paying) return
    setPaying(true)

    try {
      // Wallet payment flow
      if (selectedMethod === 'wallet') {
        if (!walletInfo || walletInfo.walletBalance < fareBreakdown.totalAmount) {
          toast.error('Insufficient wallet balance!')
          setPaying(false)
          return
        }

        await paymentService.payWithWallet(bookingId)
        setSuccess(true)
        toast.success('Booking successfully paid via Wallet! 🚗')
      } 
      // Razorpay & Google Pay flows
      else {
        const orderData = await paymentService.createOrder(bookingId)

        const options = {
          key: orderData.key,
          amount: orderData.orderId ? undefined : orderData.amount * 100, // paise
          currency: orderData.currency,
          name: 'EcoRide AI',
          description: `Ride Booking from ${booking.ride.origin.city} to ${booking.ride.destination.city}`,
          order_id: orderData.orderId,
          handler: async (response) => {
            setPaying(true)
            try {
              await paymentService.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId
              })
              setSuccess(true)
              toast.success('Payment verified successfully! 🎉')
            } catch (err) {
              toast.error('Payment verification failed.')
            } finally {
              setPaying(false)
            }
          },
          modal: {
            ondismiss: () => {
              setPaying(false)
              toast('Payment cancelled.', { icon: 'ℹ️' })
            }
          },
          prefill: {
            name: user.name,
            email: user.email,
            contact: user.phone
          },
          notes: {
            bookingId
          },
          theme: {
            color: '#10b981'
          }
        }

        // Prefill Google Pay if selected
        if (selectedMethod === 'googlepay') {
          options.config = {
            display: {
              blocks: {
                banks: {
                  name: 'Pay using Google Pay',
                  instruments: [{ method: 'upi', apps: ['google_pay'] }]
                }
              },
              sequence: ['block.banks'],
              preferences: { show_default_blocks: false }
            }
          }
        }

        const rzp = new window.Razorpay(options)
        rzp.open()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment initiation failed')
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card bg-dark-900/50 border-white/5 p-8 text-center space-y-6 shadow-2xl relative overflow-hidden"
        >
          {/* Success Ring animation */}
          <div className="w-20 h-20 bg-green-500/10 border border-green-500/25 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <FaCheckCircle className="text-green-400 text-4xl" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black font-display text-white tracking-tight">Payment Successful!</h2>
            <p className="text-gray-400 text-xs font-semibold">Your transit booking is officially confirmed.</p>
          </div>

          <div className="p-4 bg-dark-950/60 border border-white/5 rounded-2xl space-y-2 text-xs font-semibold text-gray-400">
            <div className="flex justify-between">
              <span>Paid Amount</span>
              <span className="text-white font-bold">₹{fareBreakdown?.totalAmount}</span>
            </div>
            <div className="flex justify-between">
              <span>Transaction ID</span>
              <span className="text-white font-mono text-[10px]">{booking?.paymentId || 'Wallet Tx'}</span>
            </div>
          </div>

          <div className="space-y-2.5 pt-4">
            <Link to="/bookings" className="block">
              <AnimatedButton variant="primary" fullWidth className="py-3 text-xs uppercase font-black tracking-wider">
                Go To My Bookings
              </AnimatedButton>
            </Link>
            <Link to="/payment-history" className="block">
              <AnimatedButton variant="secondary" fullWidth className="py-3 text-xs uppercase font-black tracking-wider">
                View Receipt Logs
              </AnimatedButton>
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  const isWalletInsufficient = walletInfo && fareBreakdown && walletInfo.walletBalance < fareBreakdown.totalAmount

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-500 hover:text-white transition-colors cursor-pointer"
      >
        <FaArrowLeft className="text-[10px]" /> Back to Bookings
      </button>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left 2 Columns: Summary & Payment Selectors */}
        <div className="md:col-span-2 space-y-6">
          {/* Booking Summary */}
          <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-6">
            <h3 className="text-sm font-bold text-white font-display mb-4 uppercase tracking-wider flex items-center gap-2">
              <FaReceipt className="text-primary-400" /> Booking Details
            </h3>

            <div className="space-y-4 text-xs font-semibold">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary-500/10 border border-primary-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FaRoute className="text-primary-400" />
                </div>
                <div>
                  <p className="text-white font-bold">{booking?.ride.origin.city} → {booking?.ride.destination.city}</p>
                  <p className="text-gray-500 mt-0.5">{booking?.ride.origin.address}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <div className="flex items-center gap-2.5">
                  <FaUser className="text-gray-500 text-xs" />
                  <div>
                    <p className="text-gray-500 text-[10px] uppercase">Driver</p>
                    <p className="text-white mt-0.5">{booking?.driver.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <FaUsers className="text-gray-500 text-xs" />
                  <div>
                    <p className="text-gray-500 text-[10px] uppercase">Reserved Seats</p>
                    <p className="text-white mt-0.5">{booking?.seatsBooked} seat{booking?.seatsBooked > 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Payment Method Selector */}
          <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">
              Select Payment Method
            </h3>

            <div className="space-y-3">
              {/* Razorpay Card/UPI overlay */}
              <label className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer border transition-all
                ${selectedMethod === 'razorpay'
                  ? 'bg-primary-950/10 border-primary-500/30'
                  : 'bg-dark-950/50 border-white/5 hover:border-primary-500/20'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="razorpay"
                  checked={selectedMethod === 'razorpay'}
                  onChange={() => setSelectedMethod('razorpay')}
                  className="mt-1 w-4 h-4 text-primary-500 border-white/10 bg-dark-900 focus:ring-primary-500 cursor-pointer"
                />
                <div className="flex-1">
                  <p className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <FaCreditCard className="text-primary-400" /> Card / NetBanking / UPI
                  </p>
                  <p className="text-gray-500 text-[10px] mt-0.5">Pay securely using international cards, UPI, or banking systems.</p>
                </div>
              </label>

              {/* Google Pay direct option */}
              <label className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer border transition-all
                ${selectedMethod === 'googlepay'
                  ? 'bg-primary-950/10 border-primary-500/30'
                  : 'bg-dark-950/50 border-white/5 hover:border-primary-500/20'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="googlepay"
                  checked={selectedMethod === 'googlepay'}
                  onChange={() => setSelectedMethod('googlepay')}
                  className="mt-1 w-4 h-4 text-primary-500 border-white/10 bg-dark-900 focus:ring-primary-500 cursor-pointer"
                />
                <div className="flex-1">
                  <p className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <FaGoogle className="text-primary-400" /> Google Pay
                  </p>
                  <p className="text-gray-500 text-[10px] mt-0.5">Instant checkout using your Google Pay application.</p>
                </div>
              </label>

              {/* Eco-Ride Wallet */}
              <label className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer border transition-all
                ${selectedMethod === 'wallet'
                  ? 'bg-primary-950/10 border-primary-500/30'
                  : 'bg-dark-950/50 border-white/5 hover:border-primary-500/20'
                } ${isWalletInsufficient ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="wallet"
                  disabled={isWalletInsufficient}
                  checked={selectedMethod === 'wallet'}
                  onChange={() => setSelectedMethod('wallet')}
                  className="mt-1 w-4 h-4 text-primary-500 border-white/10 bg-dark-900 focus:ring-primary-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <FaWallet className="text-primary-400" /> Eco-Ride Wallet
                    </p>
                    <span className="text-[11px] font-bold text-primary-400">
                      Balance: ₹{walletInfo?.walletBalance || 0}
                    </span>
                  </div>
                  <p className="text-gray-500 text-[10px] mt-0.5">
                    {isWalletInsufficient
                      ? 'Insufficient wallet funds. Please add money or choose another option.'
                      : 'Fast checkout directly from your virtual cash balance.'}
                  </p>
                </div>
              </label>
            </div>
          </GlassCard>
        </div>

        {/* Right 1 Column: Fare Breakdown & Action CTA */}
        <div className="md:col-span-1">
          <div className="sticky top-24 space-y-4">
            <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-6 space-y-4">
              <h3 className="text-white font-bold text-sm font-display mb-3 uppercase tracking-wider">Fare Summary</h3>

              {fareBreakdown && (
                <div className="space-y-2.5 text-xs font-semibold text-gray-400 border-b border-white/5 pb-4">
                  <div className="flex justify-between">
                    <span>Base Seat Price</span>
                    <span className="text-white">₹{fareBreakdown.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Base Fare (10%)</span>
                    <span className="text-white">₹{fareBreakdown.baseFare}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Distance Charge</span>
                    <span className="text-white">₹{fareBreakdown.distanceCharge}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration Charge</span>
                    <span className="text-white">₹{fareBreakdown.timeCharge}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee</span>
                    <span className="text-white">₹{fareBreakdown.platformFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CGST + SGST (5%)</span>
                    <span className="text-white">₹{fareBreakdown.taxes}</span>
                  </div>

                  {fareBreakdown.discount > 0 && (
                    <div className="flex justify-between text-green-400 font-bold">
                      <span className="flex items-center gap-1"><FaLeaf className="text-[10px]" /> Eco-Discount</span>
                      <span>-₹{fareBreakdown.discount}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center text-sm font-black uppercase text-white py-1">
                <span>Total Amount</span>
                <span className="text-2xl text-primary-400 font-display font-black">₹{fareBreakdown?.totalAmount}</span>
              </div>

              {isWalletInsufficient && selectedMethod === 'wallet' && (
                <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-[10px] leading-relaxed font-bold text-red-400 flex items-start gap-1.5">
                  <FaExclamationTriangle className="flex-shrink-0 mt-0.5" />
                  <span>
                    Insufficient Wallet balance. Add funds or select a cards gateway instead.
                  </span>
                </div>
              )}

              <AnimatedButton
                onClick={handlePayment}
                disabled={paying}
                variant="primary"
                fullWidth
                className="py-3.5 text-xs font-black uppercase tracking-wider"
              >
                {paying ? 'Processing...' : `Pay ₹${fareBreakdown?.totalAmount}`}
              </AnimatedButton>
            </GlassCard>

            {isWalletInsufficient && (
              <Link to="/wallet" className="block">
                <AnimatedButton variant="secondary" fullWidth className="py-2.5 text-xs font-bold uppercase tracking-wider">
                  Top-up Wallet
                </AnimatedButton>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
