import { motion } from 'framer-motion'

const SkeletonLoader = ({ 
  variant = 'card', 
  count = 1,
  className = '' 
}) => {
  const pulseVariant = {
    animate: {
      opacity: [0.3, 0.6, 0.3],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  }

  const renderSkeleton = () => {
    switch (variant) {
      case 'text':
        return (
          <div className="space-y-2">
            <div className="h-4 bg-gray-800 rounded-md w-3/4" />
            <div className="h-4 bg-gray-800 rounded-md w-1/2" />
          </div>
        )
      case 'card':
      default:
        return (
          <div className="glass bg-dark-900/50 p-6 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-800" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-800 rounded-md w-1/3" />
                <div className="h-3 bg-gray-800 rounded-md w-1/4" />
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-4 bg-gray-800 rounded-md w-full" />
              <div className="h-4 bg-gray-800 rounded-md w-5/6" />
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <div className="h-6 bg-gray-800 rounded-full w-1/4" />
              <div className="h-8 bg-gray-800 rounded-lg w-1/3" />
            </div>
          </div>
        )
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          variants={pulseVariant}
          animate="animate"
        >
          {renderSkeleton()}
        </motion.div>
      ))}
    </div>
  )
}

export default SkeletonLoader
