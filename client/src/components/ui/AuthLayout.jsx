import { motion } from 'framer-motion'
import { FaLeaf } from 'react-icons/fa'
import { Link } from 'react-router-dom'

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-[85vh] flex flex-col lg:flex-row items-center justify-center gap-12 py-10 relative overflow-hidden">
      {/* Dynamic Ambient Background Blobs */}
      <div className="absolute top-[10%] left-[-5%] w-[450px] h-[450px] bg-primary-500/5 rounded-full blur-[140px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[10%] right-[-5%] w-[450px] h-[450px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none animate-pulse" style={{ animationDuration: '10s' }} />

      {/* Brand panel */}
      <div className="lg:w-1/2 max-w-md space-y-6 text-center lg:text-left">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          <div className="flex justify-center lg:justify-start">
            <Link to="/" className="inline-flex items-center gap-2 bg-white/5 border border-white/5 rounded-2xl p-2 px-3 shadow-lg hover:scale-102 transition-all">
              <div className="w-8 h-8 bg-primary-500 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20">
                <FaLeaf className="text-white text-xs" />
              </div>
              <span className="text-sm font-black font-display text-white tracking-tight leading-none">
                EcoRide <span className="text-primary-400">AI</span>
              </span>
            </Link>
          </div>

          <h1 className="text-4xl lg:text-5xl font-black font-display text-white tracking-tight leading-tight">
            The Smart Way to <span className="text-gradient">Commute</span>
          </h1>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            Unify journeys, offset CO₂ emissions, build trust scores, and claim green rewards on our next-gen zero-emissions platform.
          </p>
        </motion.div>

        {/* Small stats overlay card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="bg-dark-900/30 border border-white/5 rounded-3xl p-5 flex items-center gap-4 backdrop-blur-md"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500/20 to-cyan-500/10 flex items-center justify-center text-primary-400 text-lg shadow-inner">
            🌱
          </div>
          <div className="text-left">
            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black block">Emissions Reduction</span>
            <p className="text-white font-black text-base font-display mt-0.5">84,930 kg CO₂ Saved</p>
          </div>
        </motion.div>
      </div>

      {/* Main card box */}
      <div className="lg:w-1/2 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-card bg-dark-900/50 backdrop-blur-xl border border-white/10 rounded-[28px] p-8 sm:p-10 shadow-2xl glow-green"
        >
          {title && (
            <div className="mb-6">
              <h2 className="text-xl font-black font-display text-white tracking-tight">{title}</h2>
              {subtitle && <p className="text-gray-400 text-xs mt-1 font-semibold">{subtitle}</p>}
            </div>
          )}
          {children}
        </motion.div>
      </div>
    </div>
  )
}

export default AuthLayout
