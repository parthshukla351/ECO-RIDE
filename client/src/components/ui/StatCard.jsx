import GlassCard from './GlassCard'

const StatCard = ({ 
  title, 
  value, 
  subtext, 
  icon: Icon, 
  trend,
  variant = 'green',
  delay = 0 
}) => {
  const gradientStyles = {
    green: 'from-green-500/10 to-emerald-500/5 border-green-500/20 text-green-400',
    cyan: 'from-cyan-500/10 to-blue-500/5 border-cyan-500/20 text-cyan-400',
    purple: 'from-purple-500/10 to-indigo-500/5 border-purple-500/20 text-purple-400',
    yellow: 'from-yellow-500/10 to-orange-500/5 border-yellow-500/20 text-yellow-400'
  }

  return (
    <GlassCard 
      className={`bg-gradient-to-br ${gradientStyles[variant]}`}
      delay={delay}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs uppercase tracking-widest font-bold text-gray-400">{title}</span>
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg shadow-inner">
            <Icon />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-white font-black font-display text-3xl tracking-tight">{value}</h3>
        {trend && (
          <span className="text-xs font-bold text-green-400">{trend}</span>
        )}
      </div>
      {subtext && (
        <p className="text-gray-400 text-xs mt-2 font-medium">{subtext}</p>
      )}
    </GlassCard>
  )
}

export default StatCard
