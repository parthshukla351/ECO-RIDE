import { motion } from 'framer-motion'
import { FaCheck, FaTimes } from 'react-icons/fa'

const PasswordStrength = ({ value = '' }) => {
  const rules = [
    { label: 'Minimum 8 characters', test: (val) => val.length >= 8 },
    { label: 'Contains a number', test: (val) => /[0-9]/.test(val) },
    { label: 'Contains uppercase letter', test: (val) => /[A-Z]/.test(val) },
    { label: 'Contains a symbol', test: (val) => /[^A-Za-z0-9]/.test(val) }
  ]

  const passedCount = rules.filter(r => r.test(value)).length

  const getStrengthMeta = (count) => {
    if (count === 0) return { label: 'Incomplete', color: 'bg-gray-700', textClass: 'text-gray-500' }
    if (count <= 2) return { label: 'Weak', color: 'bg-red-500/80', textClass: 'text-red-400' }
    if (count === 3) return { label: 'Medium', color: 'bg-yellow-500/80', textClass: 'text-yellow-400' }
    return { label: 'Strong', color: 'bg-green-500', textClass: 'text-green-400' }
  }

  const meta = getStrengthMeta(passedCount)

  return (
    <div className="space-y-3 pt-2 text-xs">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
        <span className="text-gray-500">Password Security</span>
        <span className={meta.textClass}>{meta.label}</span>
      </div>

      {/* Progress Bars */}
      <div className="h-1 bg-white/5 rounded-full overflow-hidden flex gap-0.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-full flex-1 rounded-full transition-all duration-300 ${
              i < passedCount ? meta.color : 'bg-white/5'
            }`}
          />
        ))}
      </div>

      {/* Checklist */}
      <ul className="space-y-1 text-[10px] font-semibold text-gray-500">
        {rules.map((rule, idx) => {
          const isPassed = rule.test(value)
          return (
            <motion.li
              key={idx}
              initial={false}
              animate={{ color: isPassed ? '#e2e8f0' : '#6b7280' }}
              className="flex items-center gap-1.5"
            >
              {isPassed ? (
                <FaCheck className="text-green-400 text-[8px]" />
              ) : (
                <FaTimes className="text-red-500/50 text-[8px]" />
              )}
              <span>{rule.label}</span>
            </motion.li>
          )
        })}
      </ul>
    </div>
  )
}

export default PasswordStrength
