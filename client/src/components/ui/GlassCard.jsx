import { motion } from 'framer-motion'

const GlassCard = ({ 
  children, 
  className = '', 
  hoverable = true, 
  delay = 0,
  glow = false,
  ...props 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay, 
        ease: [0.16, 1, 0.3, 1] 
      }}
      whileHover={hoverable ? { 
        y: -4, 
        borderColor: 'rgba(16, 185, 129, 0.25)',
        boxShadow: glow 
          ? '0 20px 40px -15px rgba(16, 185, 129, 0.15)' 
          : '0 20px 40px -15px rgba(0, 0, 0, 0.4)'
      } : undefined}
      className={`glass bg-white/80 dark:bg-dark-900/50 backdrop-blur-md border border-slate-200/80 dark:border-white/5 text-slate-900 dark:text-gray-100 rounded-2xl p-6 shadow-md dark:shadow-xl transition-all duration-300 ${
        hoverable ? 'cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export default GlassCard
