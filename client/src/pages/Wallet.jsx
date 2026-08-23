import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FaWallet, FaPlusCircle, FaHistory, FaArrowUp, FaArrowDown, 
  FaLeaf, FaRegCheckCircle, FaExchangeAlt, FaChevronRight 
} from 'react-icons/fa'
import { useAuth } from '../contexts/AuthContext'
import GlassCard from '../components/ui/GlassCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import paymentService from '../services/paymentService'
import toast from 'react-hot-toast'

const Wallet = () => {
  const { user } = useAuth()
  
  const [walletInfo, setWalletInfo] = useState(null)
  const [amount, setAmount] = useState('500')
  
  const [loading, setLoading] = useState(true)
  const [toppingUp, setToppingUp] = useState(false)

  // Inject Razorpay Script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)

    fetchWalletData()

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  const fetchWalletData = async () => {
    try {
      const data = await paymentService.getWalletInfo()
      setWalletInfo(data)
    } catch (error) {
      toast.error('Failed to load wallet information')
    } finally {
      setLoading(false)
    }
  }

  // Handle Wallet Top Up via Razorpay
  const handleTopUp = async (e) => {
    e.preventDefault()
    const numAmt = parseFloat(amount)
    if (isNaN(numAmt) || numAmt <= 0) {
      return toast.error('Please enter a valid amount')
    }
    
    setToppingUp(true)
    try {
      const orderData = await paymentService.topUpWallet(numAmt)

      const options = {
        key: orderData.key,
        amount: orderData.amount * 100, // paise
        currency: orderData.currency,
        name: 'EcoRide Wallet Topup',
        description: 'Add cash balance to your Eco-Ride Wallet',
        order_id: orderData.orderId,
        handler: async (response) => {
          setToppingUp(true)
          try {
            const result = await paymentService.verifyWalletTopUp({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: numAmt
            })
            toast.success('Funds added successfully! 💰')
            setWalletInfo(prev => ({
              ...prev,
              walletBalance: result.walletBalance
            }))
            // Refresh transaction list
            fetchWalletData()
          } catch (err) {
            toast.error('Failed to verify top-up signature')
          } finally {
            setToppingUp(false)
          }
        },
        modal: {
          ondismiss: () => {
            setToppingUp(false)
            toast('Top up cancelled.', { icon: 'info' })
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone
        },
        theme: {
          color: '#10b981'
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Top-up failed')
      setToppingUp(false)
    }
  }

  const transactionTypeStyle = {
    TOP_UP: { icon: <FaArrowUp className="text-green-400" />, label: 'Top-up Credit', bg: 'bg-green-500/10 text-green-400' },
    RIDE_PAYMENT: { icon: <FaArrowDown className="text-red-400" />, label: 'Ride Payment', bg: 'bg-red-500/10 text-red-400' },
    REFUND: { icon: <FaArrowUp className="text-blue-400" />, label: 'Refund Credit', bg: 'bg-blue-500/10 text-blue-400' },
    EARNINGS: { icon: <FaArrowUp className="text-emerald-400" />, label: 'Ride Earnings', bg: 'bg-emerald-500/10 text-emerald-400' }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black font-display text-white tracking-tight flex items-center gap-2">
          <FaWallet className="text-primary-400" /> Virtual Wallet
        </h1>
        <p className="text-gray-400 text-xs font-semibold mt-1">Manage cash balance, top up instantly, and view transaction history.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Wallet Balance & Loader Section */}
        <div className="md:col-span-1 space-y-6">
          {/* Balance card */}
          <GlassCard hoverable={false} className="relative overflow-hidden bg-gradient-to-br from-primary-950/20 to-emerald-950/20 border-primary-500/20 shadow-2xl p-6">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <FaWallet className="text-9xl" />
            </div>

            <div className="space-y-6 relative">
              <span className="px-2 py-0.5 bg-primary-500/10 border border-primary-500/20 text-primary-400 text-[9px] font-black uppercase rounded-full tracking-wider leading-none">
                Available Cash
              </span>

              <div>
                <p className="text-4xl font-black text-white font-display">₹{walletInfo?.walletBalance?.toFixed(2) || '0.00'}</p>
                <p className="text-gray-500 text-[10px] font-semibold mt-1 uppercase tracking-wider">Secured Virtual Assets</p>
              </div>

              <div className="border-t border-white/5 pt-4 flex items-center justify-between text-[11px] font-bold text-gray-500">
                <span>Verified Holder</span>
                <span className="text-white">{user?.name}</span>
              </div>
            </div>
          </GlassCard>

          {/* Quick Top-Up form */}
          <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-6">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <FaPlusCircle className="text-primary-400" /> Load Wallet
            </h3>

            <form onSubmit={handleTopUp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider">Enter Amount (INR)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-bold">₹</span>
                  <input
                    type="number"
                    min="50"
                    placeholder="500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="input-field pl-9 bg-dark-950/80 font-bold font-display"
                  />
                </div>
              </div>

              {/* Presets */}
              <div className="grid grid-cols-3 gap-2">
                {['200', '500', '1000'].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    className={`py-2 text-[10px] font-black tracking-wider uppercase rounded-xl border transition-all cursor-pointer
                      ${amount === preset
                        ? 'bg-primary-500/10 border-primary-500/30 text-white'
                        : 'bg-dark-950/50 border-white/5 hover:border-white/10 text-gray-400'
                      }`}
                  >
                    +₹{preset}
                  </button>
                ))}
              </div>

              <AnimatedButton
                type="submit"
                disabled={toppingUp}
                variant="primary"
                fullWidth
                className="py-3 text-xs uppercase font-black tracking-wider mt-2"
              >
                {toppingUp ? 'Top-up Loading...' : 'Load Funds'}
              </AnimatedButton>
            </form>
          </GlassCard>
        </div>

        {/* Transaction History Ledger */}
        <div className="md:col-span-2">
          <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-6 h-full flex flex-col">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-6 flex items-center gap-1.5">
              <FaHistory className="text-primary-400" /> Transaction Ledger
            </h3>

            {walletInfo?.transactions?.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 space-y-3">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                  <FaExchangeAlt className="text-gray-500 text-lg" />
                </div>
                <div>
                  <p className="text-white font-bold text-xs">No transactions recorded yet</p>
                  <p className="text-gray-500 text-[10px] mt-0.5">Top-up or take rides to start virtual ledger logs.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                {walletInfo?.transactions?.map((tx) => {
                  const style = transactionTypeStyle[tx.type] || { icon: <FaExchangeAlt />, label: tx.type, bg: 'bg-white/5 text-white' }
                  return (
                    <div
                      key={tx._id}
                      className="p-4 bg-dark-950/50 border border-white/5 rounded-2xl flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${style.bg} bg-opacity-10 border border-white/5 flex-shrink-0`}>
                          {style.icon}
                        </div>
                        <div>
                          <p className="text-white font-bold text-xs">{style.label}</p>
                          <p className="text-gray-500 text-[9px] mt-0.5 font-bold uppercase tracking-wider flex items-center gap-1">
                            {new Date(tx.createdAt).toLocaleString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            {tx.referenceId && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-[8px]">Ref: {tx.referenceId.slice(-6)}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`text-sm font-black font-display ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount)}
                        </p>
                        <p className="text-[9px] text-gray-500 font-semibold mt-0.5">
                          Bal: ₹{tx.balanceAfter}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

export default Wallet
