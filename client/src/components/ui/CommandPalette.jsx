import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaSearch, FaSearchLocation, FaPlusCircle, FaUser, FaTicketAlt, FaBell, FaComments, FaSignOutAlt, FaTimes } from 'react-icons/fa'
import { useAuth } from '../../contexts/AuthContext'

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const listRef = useRef(null)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      } else if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const actions = [
    {
      title: 'Find a Ride',
      subtitle: 'Search for eco-friendly shared commutes',
      icon: FaSearchLocation,
      shortcut: 'F',
      action: () => navigate('/search'),
      roles: ['passenger', 'driver', 'admin']
    },
    {
      title: 'Publish a Ride',
      subtitle: 'Create a new ride itinerary to share',
      icon: FaPlusCircle,
      shortcut: 'P',
      action: () => navigate('/driver/publish-ride'),
      roles: ['driver']
    },
    {
      title: 'My Bookings',
      subtitle: 'View seats you have reserved',
      icon: FaTicketAlt,
      shortcut: 'B',
      action: () => navigate('/bookings'),
      roles: ['passenger']
    },
    {
      title: 'My Profile',
      subtitle: 'Configure your vehicle and preferences',
      icon: FaUser,
      shortcut: 'U',
      action: () => navigate('/profile'),
      roles: ['passenger', 'driver', 'admin']
    },
    {
      title: 'Notifications',
      subtitle: 'Review recent system alerts',
      icon: FaBell,
      shortcut: 'N',
      action: () => navigate('/notifications'),
      roles: ['passenger', 'driver', 'admin']
    },
    {
      title: 'Chat Inbox',
      subtitle: 'Exchange messages with drivers/passengers',
      icon: FaComments,
      shortcut: 'C',
      action: () => navigate('/chat'),
      roles: ['passenger', 'driver']
    },
    {
      title: 'Logout',
      subtitle: 'Terminate your active session safely',
      icon: FaSignOutAlt,
      shortcut: 'L',
      action: () => {
        logout()
        navigate('/login')
      },
      roles: ['passenger', 'driver', 'admin']
    }
  ].filter((a) => !isAuthenticated || a.roles.includes(user?.role))

  const filteredActions = actions.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.subtitle.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  const handleActionKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % filteredActions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % filteredActions.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredActions[selectedIndex]) {
        filteredActions[selectedIndex].action()
        setIsOpen(false)
      }
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Palette Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-dark-950/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-10 glass-dark glow-green"
        >
          {/* Input Bar */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
            <FaSearch className="text-gray-500 text-lg" />
            <input
              autoFocus
              type="text"
              placeholder="Search actions... (Esc to close)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleActionKeyDown}
              className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm outline-none border-none"
            />
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-white"
            >
              <FaTimes />
            </button>
          </div>

          {/* Results List */}
          <div 
            ref={listRef}
            className="max-h-[320px] overflow-y-auto p-2 space-y-1"
          >
            {filteredActions.length === 0 ? (
              <p className="text-center text-xs text-gray-500 py-8">No actions matched your query</p>
            ) : (
              filteredActions.map((action, i) => {
                const Icon = action.icon
                const isSelected = i === selectedIndex

                return (
                  <button
                    key={action.title}
                    onClick={() => {
                      action.action()
                      setIsOpen(false)
                    }}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left ${
                      isSelected 
                        ? 'bg-primary-500/10 border border-primary-500/20 text-white' 
                        : 'border border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                        isSelected ? 'bg-primary-500/20 text-primary-400' : 'bg-white/5'
                      }`}>
                        <Icon />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{action.title}</h4>
                        <p className="text-[11px] text-gray-500 leading-tight">{action.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-gray-600 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded uppercase font-mono">
                        {action.shortcut}
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
          
          {/* Palette Footer */}
          <div className="px-4 py-2 bg-dark-900 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
            <span>Use ↑↓ arrows to navigate, Enter to select</span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">ctrl</kbd> + 
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">k</kbd> to toggle
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default CommandPalette
