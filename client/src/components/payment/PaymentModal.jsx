import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaTimes, FaCreditCard, FaMoneyBillWave, FaLock,
  FaCheckCircle, FaLeaf, FaShieldAlt 
} from 'react-icons/fa'
import api from '../../services/api'
import toast from 'react-hot-toast'

const PaymentModal = ({ isOpen, onClose, booking, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('razorpay')

  const handlePayment = async () => {
    if (paymentMethod === 'razorpay') {
      await handleRazorpayPayment()
    } else if (paymentMethod === 'cash') {
      toast.success('Cash payment selected. Pay the driver directly.')
      onSuccess?.()
      onClose()
    }
  }

  const handleRazorpayPayment = async () => {
    setLoading(true)
    try {
      // Create order
      const { data: orderData } = await api.post('/payments/create-order', {
        bookingId: booking._id
      })

      // Load Razorpay
      const options = {
        key: orderData.key,
        amount: orderData.amount * 100,
        currency: orderData.currency,
        name: 'EcoRide AI',
        description: `Ride Booking - ${booking.ride?.origin?.city} to ${booking.ride?.destination?.city}`,
        order_id: orderData.orderId,
        image: '/logo.png',
        prefill: {
          name: booking.passenger?.name,
          email: booking.passenger?.email,
          contact: booking.passenger?.phone
        },
        theme: {
          color: '#10b981',
          backdrop_color: '#111827'
        },
        handler: async function (response) {
          try {
            // Verify payment
            const { data: verifyData } = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: booking._id
            })

            setPaymentSuccess(true)
            toast.success('Payment successful! 🎉')
            
            setTimeout(() => {
              onSuccess?.()
              onClose()
            }, 2500)

          } catch (error) {
            toast.error('Payment verification failed')
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false)
            toast('Payment cancelled', { icon: '⚠️' })
          }
        }
      }

      // Load Razorpay script if not loaded
      if (!window.Razorpay) {
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.async = true
        document.body.appendChild(script)
        await new Promise((resolve) => { script.onload = resolve })
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create payment order')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md glass-dark p-6 z-10"
        >
          {paymentSuccess ? (
            /* Success State */
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
              >
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 glow-green">
                  <FaCheckCircle className="text-green-400 text-4xl" />
                </div>
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-2">Payment Successful!</h3>
              <p className="text-gray-400 mb-4">Your ride has been confirmed</p>
              
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl mb-4">
                <div className="flex items-center justify-center gap-2 text-green-400">
                  <FaLeaf />
                  <span className="font-semibold">
                    You saved {booking?.carbonSaved?.toFixed(2)} kg of CO₂!
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  +{booking?.ecoPointsEarned} eco points earned
                </p>
              </div>

              <p className="text-gray-500 text-sm">Redirecting to your bookings...</p>
            </div>
          ) : (
            /* Payment Form */
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Complete Payment</h2>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Ride Summary */}
              <div className="p-4 bg-gray-800/50 rounded-xl mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-gray-400 text-xs">Route</p>
                    <p className="text-white font-semibold">
                      {booking?.ride?.origin?.city} → {booking?.ride?.destination?.city}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-xs">Date</p>
                    <p className="text-white text-sm">
                      {booking?.ride?.departureTime && new Date(booking.ride.departureTime).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Seats</span>
                    <span className="text-white">{booking?.seatsBooked}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price per seat</span>
                    <span className="text-white">₹{booking?.pricePerSeat}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-700">
                    <span className="text-white font-bold">Total Amount</span>
                    <span className="text-primary-400 font-black text-xl">₹{booking?.totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-3 mb-6">
                <p className="text-sm font-medium text-gray-300">Payment Method</p>
                
                <label
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'razorpay'
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="sr-only"
                  />
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <FaCreditCard className="text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">Online Payment</p>
                    <p className="text-gray-400 text-xs">UPI, Cards, Net Banking via Razorpay</p>
                  </div>
                  <FaShieldAlt className="text-green-400 text-sm" />
                </label>

                <label
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'cash'
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="sr-only"
                  />
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <FaMoneyBillWave className="text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">Cash Payment</p>
                    <p className="text-gray-400 text-xs">Pay directly to the driver</p>
                  </div>
                </label>
              </div>

              {/* Eco Impact */}
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg mb-6">
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <FaLeaf />
                  <span>
                    This ride saves {booking?.carbonSaved?.toFixed(2)} kg CO₂ and earns you {booking?.ecoPointsEarned} eco points!
                  </span>
                </div>
              </div>

              {/* Pay Button */}
              <button
                onClick={handlePayment}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FaLock /> Pay ₹{booking?.totalAmount}
                  </>
                )}
              </button>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 mt-4 text-gray-500 text-xs">
                <FaShieldAlt />
                <span>Secure payment powered by Razorpay</span>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default PaymentModal