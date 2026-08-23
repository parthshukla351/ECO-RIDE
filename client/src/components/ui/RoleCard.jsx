import { FaUser, FaCar } from 'react-icons/fa'

const RoleCard = ({ value = 'passenger', onChange }) => {
  const roles = [
    {
      id: 'passenger',
      title: 'Rider / Passenger',
      description: 'Book seats, offset carbon, and share eco commutes.',
      icon: FaUser,
      glow: 'hover:border-green-500/20 active:border-green-500/30'
    },
    {
      id: 'driver',
      title: 'Driver / Publisher',
      description: 'Publish trips, share vehicle space, and earn points.',
      icon: FaCar,
      glow: 'hover:border-cyan-500/20 active:border-cyan-500/30'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {roles.map(role => {
        const isSelected = value === role.id
        const Icon = role.icon

        return (
          <button
            key={role.id}
            type="button"
            onClick={() => onChange(role.id)}
            className={`p-4 rounded-2xl border text-left transition-all duration-300 flex flex-col gap-3 relative overflow-hidden group cursor-pointer
              ${isSelected
                ? 'bg-primary-500/10 border-primary-500/35 text-white shadow-lg shadow-primary-500/5'
                : 'bg-dark-950/80 border-white/5 text-gray-400 hover:text-white'
              }`}
          >
            {/* Highlight bubble */}
            <div className={`absolute -right-4 -top-4 w-12 h-12 rounded-full blur-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
              ${isSelected ? 'bg-primary-500/10' : 'bg-white/5'}`}
            />

            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base border transition-all duration-300
              ${isSelected
                ? 'bg-primary-500/20 border-primary-500/20 text-primary-400'
                : 'bg-white/5 border-transparent text-gray-500 group-hover:text-gray-300'
              }`}
            >
              <Icon />
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">{role.title}</h4>
              <p className="text-gray-500 text-[10px] font-semibold mt-1 leading-normal">{role.description}</p>
            </div>

            {/* Select status checkbox indicator */}
            <div className="absolute right-4 top-4 flex items-center justify-center">
              <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] transition-all
                ${isSelected 
                  ? 'border-primary-500 bg-primary-500 text-white' 
                  : 'border-white/10 bg-dark-950'
                }`}>
                {isSelected && '✓'}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default RoleCard
