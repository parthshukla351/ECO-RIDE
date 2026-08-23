import { motion } from 'framer-motion'

const AnimatedButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  type = 'button',
  disabled = false,
  className = '',
  fullWidth = false,
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold text-sm rounded-xl transition-all duration-200 outline-none cursor-pointer border'
  
  const variants = {
    primary: 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white border-primary-500/20 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/35',
    secondary: 'bg-white/5 hover:bg-white/10 text-gray-200 border-white/5 hover:border-white/10 backdrop-blur-md',
    outline: 'border-primary-500/40 hover:border-primary-400 text-primary-400 hover:bg-primary-500/5',
    danger: 'bg-red-500/10 hover:bg-red-500/25 text-red-400 border-red-500/20 hover:border-red-400/30'
  }

  const paddingStyles = 'px-5 py-3'

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.01 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${paddingStyles}
        ${fullWidth ? 'w-full' : ''} 
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''} 
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.button>
  )
}

export default AnimatedButton
