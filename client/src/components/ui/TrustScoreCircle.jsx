import { motion } from 'framer-motion'
import { FaShieldAlt } from 'react-icons/fa'

const TrustScoreCircle = ({ score = 75, size = 120 }) => {
  const radius = 50
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  const getBadgeDetails = (val) => {
    if (val >= 90) return { label: 'Diamond', color: 'text-cyan-400', border: 'border-cyan-500/25 bg-cyan-500/10', glow: 'shadow-cyan-500/15', colorHex: '#22d3ee' }
    if (val >= 75) return { label: 'Platinum', color: 'text-slate-300', border: 'border-slate-500/25 bg-slate-500/10', glow: 'shadow-slate-500/15', colorHex: '#cbd5e1' }
    if (val >= 60) return { label: 'Gold', color: 'text-yellow-400', border: 'border-yellow-500/25 bg-yellow-500/10', glow: 'shadow-yellow-500/15', colorHex: '#facc15' }
    if (val >= 40) return { label: 'Silver', color: 'text-gray-400', border: 'border-gray-500/25 bg-gray-500/10', glow: 'shadow-gray-500/15', colorHex: '#9ca3af' }
    return { label: 'Bronze', color: 'text-amber-600', border: 'border-amber-700/25 bg-amber-700/10', glow: 'shadow-amber-700/15', colorHex: '#d97706' }
  }

  const badge = getBadgeDetails(score)

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Animated Progress Circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          {/* Base track */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            className="stroke-white/5"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Active progress */}
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            stroke={badge.colorHex}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>

        {/* Text inside the ring */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-black font-display text-white leading-none">{score}</span>
          <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-1">Trust Score</span>
        </div>
      </div>

      {/* Tier Badge pill */}
      <div className={`mt-4 px-3 py-1 border rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg ${badge.border} ${badge.color} ${badge.glow}`}>
        <FaShieldAlt className="text-[10px]" />
        <span>{badge.label} Member</span>
      </div>
    </div>
  )
}

export default TrustScoreCircle
