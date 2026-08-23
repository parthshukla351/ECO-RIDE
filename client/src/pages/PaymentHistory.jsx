import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaHistory, FaCalendarAlt, FaCheckCircle, FaTimesCircle, 
  FaClock, FaReceipt, FaCreditCard, FaWallet, FaSearch,
  FaArrowLeft, FaPrint, FaShareAlt
} from 'react-icons/fa'
import GlassCard from '../components/ui/GlassCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import paymentService from '../services/paymentService'
import toast from 'react-hot-toast'

const PaymentHistory = () => {
  const [payments, setPayments] = useState([])
  const [filter, setFilter] = useState('all') // 'all', 'captured', 'created', 'failed'
  
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  
  const [selectedPayment, setSelectedPayment] = useState(null)

  useEffect(() => {
    fetchPayments()
  }, [page, filter])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const data = await paymentService.getPaymentHistory(page, 10)
      
      // Client-side filtering as secondary filter since backend retrieves all payer/payee records
      let filtered = data.payments
      if (filter === 'captured') {
        filtered = filtered.filter(p => p.status === 'captured')
      } else if (filter === 'created') {
        filtered = filtered.filter(p => p.status === 'created' || p.status === 'pending')
      } else if (filter === 'failed') {
        filtered = filtered.filter(p => p.status === 'failed')
      }

      setPayments(filtered)
      setTotalPages(data.pages || 1)
    } catch (error) {
      toast.error('Failed to fetch payment history')
    } finally {
      setLoading(false)
    }
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case 'captured':
      case 'success':
        return { label: 'Successful', color: 'text-green-400 border-green-500/25 bg-green-500/10', icon: <FaCheckCircle /> }
      case 'failed':
        return { label: 'Failed', color: 'text-red-400 border-red-500/25 bg-red-500/10', icon: <FaTimesCircle /> }
      default:
        return { label: 'Pending', color: 'text-yellow-400 border-yellow-500/25 bg-yellow-500/10', icon: <FaClock /> }
    }
  }

  const getMethodIcon = (method) => {
    switch (method) {
      case 'wallet':
        return <span className="flex items-center gap-1 text-[10px] uppercase font-bold"><FaWallet className="text-primary-400 text-xs" /> Wallet</span>
      default:
        return <span className="flex items-center gap-1 text-[10px] uppercase font-bold"><FaCreditCard className="text-primary-400 text-xs" /> Cards / UPI</span>
    }
  }

  if (loading && page === 1) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black font-display text-white tracking-tight flex items-center gap-2">
          <FaReceipt className="text-primary-400 animate-pulse" /> Receipt Logs
        </h1>
        <p className="text-gray-400 text-xs font-semibold mt-1">Review verified transit receipts, transaction breakdowns, and status audits.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-white/5 pb-1 gap-2 overflow-x-auto">
        {[
          { key: 'all', label: 'All Receipts' },
          { key: 'captured', label: 'Successful' },
          { key: 'created', label: 'Pending' },
          { key: 'failed', label: 'Failed' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => { setFilter(tab.key); setPage(1) }}
            className={`py-2 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap
              ${filter === tab.key
                ? 'border-primary-500 text-white font-black'
                : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Payment Table/Cards List */}
      {payments.length === 0 ? (
        <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 py-16 text-center space-y-3">
          <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto">
            <FaHistory className="text-gray-500 text-lg" />
          </div>
          <div>
            <p className="text-white font-bold text-xs">No receipts found</p>
            <p className="text-gray-500 text-[10px] mt-0.5">Your payment logs are currently empty.</p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {payments.map(payment => {
            const status = getStatusStyle(payment.status)
            return (
              <motion.div
                key={payment._id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedPayment(payment)}
                className="glass-card bg-dark-900/40 hover:bg-dark-900/60 border border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-primary-500/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary-500/10 border border-primary-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FaReceipt className="text-primary-400 text-sm" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-bold text-xs">₹{payment.amount}</p>
                      <span className={`px-2 py-0.5 border text-[8px] font-black uppercase rounded-full tracking-wider flex items-center gap-1 ${status.color}`}>
                        {status.icon} {status.label}
                      </span>
                    </div>
                    <p className="text-gray-500 text-[9px] font-bold uppercase tracking-wider mt-1 flex items-center gap-1.5">
                      <span className="flex items-center gap-0.5"><FaCalendarAlt className="text-[10px]" /> {new Date(payment.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span>•</span>
                      <span>{getMethodIcon(payment.method)}</span>
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <p>Transaction ID</p>
                  <p className="font-mono text-white text-[9px] mt-0.5 normal-case">
                    {payment.razorpayPaymentId || payment._id.slice(-12)}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <AnimatedButton
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            variant="secondary"
            className="py-1 px-3 text-[9px] font-black uppercase"
          >
            Prev
          </AnimatedButton>
          <span className="text-[10px] font-bold text-gray-500">
            Page {page} of {totalPages}
          </span>
          <AnimatedButton
            disabled={page === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            variant="secondary"
            className="py-1 px-3 text-[9px] font-black uppercase"
          >
            Next
          </AnimatedButton>
        </div>
      )}

      {/* Detail Modal overlay */}
      <AnimatePresence>
        {selectedPayment && (
          <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-dark-900 border border-white/5 rounded-3xl p-6 shadow-2xl relative space-y-6"
            >
              {/* Receipt Design */}
              <div className="text-center space-y-1.5 pb-4 border-b border-white/5">
                <div className="w-12 h-12 bg-primary-500/10 border border-primary-500/20 rounded-full flex items-center justify-center mx-auto text-primary-400 text-lg">
                  <FaReceipt />
                </div>
                <h3 className="text-white font-black font-display text-lg tracking-tight">Eco-Ride Transit Invoice</h3>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Verified Transaction Slip</p>
              </div>

              {/* Invoice Table details */}
              <div className="space-y-3.5 text-xs font-semibold text-gray-400">
                <div className="flex justify-between">
                  <span>Merchant</span>
                  <span className="text-white">EcoRide Mobility Ltd.</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid By</span>
                  <span className="text-white">{selectedPayment.payer?.name || 'User Acc'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date & Time</span>
                  <span className="text-white">
                    {new Date(selectedPayment.createdAt).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Gateway</span>
                  <span className="text-white capitalize">{selectedPayment.method}</span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-3">
                  <span>Booking Code</span>
                  <span className="text-white font-mono text-[10px]">{selectedPayment.booking?._id || selectedPayment.booking || 'Wallet Topup'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Order Reference</span>
                  <span className="text-white font-mono text-[10px]">{selectedPayment.razorpayOrderId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Verification Signature</span>
                  <span className="text-white font-mono text-[9px] max-w-[180px] truncate">{selectedPayment.razorpaySignature || 'N/A'}</span>
                </div>
              </div>

              {/* Total block */}
              <div className="p-4 bg-dark-950/60 border border-white/5 rounded-2xl flex justify-between items-center text-sm uppercase text-white font-black">
                <span>Authorized Amount</span>
                <span className="text-xl text-primary-400 font-display font-black">₹{selectedPayment.amount}</span>
              </div>

              {/* Footer Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <AnimatedButton
                  onClick={() => window.print()}
                  variant="secondary"
                  className="py-2.5 text-[10px] uppercase font-black tracking-wider flex items-center justify-center gap-1.5"
                >
                  <FaPrint /> Print Receipt
                </AnimatedButton>
                <AnimatedButton
                  onClick={() => setSelectedPayment(null)}
                  variant="primary"
                  className="py-2.5 text-[10px] uppercase font-black tracking-wider"
                >
                  Close Receipt
                </AnimatedButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PaymentHistory
