import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaLeaf, FaBars, FaTimes, FaUser, FaSignOutAlt, FaPlus, FaSearch, FaComment, FaBell, FaCog, FaWallet, FaReceipt } from 'react-icons/fa'
import { useAuth } from '../../contexts/AuthContext'
import AnimatedButton from '../ui/AnimatedButton'

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    setDropdownOpen(false)
    setMobileMenuOpen(false)
    navigate('/login')
  }

  const getDashboardPath = () => {
    if (user?.role === 'driver') return '/driver/dashboard'
    if (user?.role === 'admin') return '/admin'
    return '/dashboard'
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="sticky top-4 mx-auto w-[calc(100%-2rem)] max-w-7xl z-50 rounded-2xl border border-white/5 bg-dark-950/75 backdrop-blur-xl shadow-2xl transition-all duration-300">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 relative z-50">
            <div className="w-8 h-8 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
              <FaLeaf className="text-white text-sm" />
            </div>
            <span className="text-lg font-black font-display text-white tracking-tight">
              EcoRide <span className="text-primary-500">AI</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            {!isAuthenticated ? (
              <>
                <Link to="/" className={`text-xs uppercase tracking-wider font-bold transition-colors ${isActive('/') ? 'text-primary-400' : 'text-gray-400 hover:text-white'}`}>Home</Link>
                <Link to="/search" className={`text-xs uppercase tracking-wider font-bold transition-colors ${isActive('/search') ? 'text-primary-400' : 'text-gray-400 hover:text-white'}`}>Search Rides</Link>
                <span className="text-gray-400 text-xs uppercase tracking-wider font-bold hover:text-white cursor-pointer transition-colors">About</span>
                <span className="text-gray-400 text-xs uppercase tracking-wider font-bold hover:text-white cursor-pointer transition-colors">Contact</span>
              </>
            ) : (
              <>
                <Link 
                  to={getDashboardPath()} 
                  className={`text-xs uppercase tracking-wider font-bold transition-colors ${isActive(getDashboardPath()) ? 'text-primary-400' : 'text-gray-400 hover:text-white'}`}
                >
                  Dashboard
                </Link>
                
                {user?.role === 'driver' && (
                  <Link 
                    to="/driver/publish-ride" 
                    className={`text-xs uppercase tracking-wider font-bold transition-colors flex items-center gap-1.5 ${isActive('/driver/publish-ride') ? 'text-primary-400' : 'text-gray-400 hover:text-white'}`}
                  >
                    <FaPlus className="text-[10px]" /> Publish Ride
                  </Link>
                )}

                <Link 
                  to="/search" 
                  className={`text-xs uppercase tracking-wider font-bold transition-colors flex items-center gap-1.5 ${isActive('/search') ? 'text-primary-400' : 'text-gray-400 hover:text-white'}`}
                >
                  <FaSearch className="text-[10px]" /> Search Ride
                </Link>

                <Link 
                  to="/chat" 
                  className={`text-xs uppercase tracking-wider font-bold transition-colors flex items-center gap-1.5 ${isActive('/chat') ? 'text-primary-400' : 'text-gray-400 hover:text-white'}`}
                >
                  <FaComment className="text-[10px]" /> Messages
                </Link>

                <Link 
                  to="/notifications" 
                  className={`text-xs uppercase tracking-wider font-bold transition-colors flex items-center gap-1.5 relative ${isActive('/notifications') ? 'text-primary-400' : 'text-gray-400 hover:text-white'}`}
                >
                  <FaBell className="text-[10px]" /> Notifications
                </Link>

                <Link 
                  to="/ai-assistant" 
                  className={`text-xs uppercase tracking-wider font-bold transition-colors flex items-center gap-1.5 ${isActive('/ai-assistant') ? 'text-primary-400' : 'text-gray-400 hover:text-white'}`}
                >
                  ✨ Eco Assistant
                </Link>

                <Link 
                  to="/rewards" 
                  className={`text-xs uppercase tracking-wider font-bold transition-colors flex items-center gap-1.5 ${isActive('/rewards') ? 'text-primary-400' : 'text-gray-400 hover:text-white'}`}
                >
                  🎁 Rewards Store
                </Link>
              </>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center gap-4">
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="text-xs uppercase tracking-wider font-bold text-gray-400 hover:text-white transition-colors">
                  Log in
                </Link>
                <Link to="/register">
                  <AnimatedButton variant="primary" className="px-4 py-2 text-xs uppercase tracking-wider font-bold">
                    Sign up
                  </AnimatedButton>
                </Link>
              </>
            ) : (
              <div className="relative">
                {/* User Profile Trigger */}
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-full pl-2 pr-4 py-1.5 hover:bg-white/10 transition-all outline-none cursor-pointer"
                >
                  <img
                    src={user?.avatar || 'https://res.cloudinary.com/demo/image/upload/v1/default-avatar.png'}
                    alt={user?.name}
                    className="w-7 h-7 rounded-full object-cover border border-white/15"
                  />
                  <div className="text-left leading-tight hidden lg:block">
                    <p className="text-xs font-black text-white">{user?.name?.split(' ')[0]}</p>
                    <p className="text-[9px] text-primary-400 font-black uppercase tracking-wider">{user?.ecoLevel || 'Seedling'}</p>
                  </div>
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2.5 w-48 bg-dark-950/90 border border-white/5 rounded-xl shadow-2xl p-2 z-50 text-sm glass-dark"
                    >
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors font-semibold"
                      >
                        <FaUser className="text-xs text-primary-400" /> Profile
                      </Link>
                      <Link
                        to="/wallet"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors font-semibold"
                      >
                        <FaWallet className="text-xs text-primary-400" /> My Wallet
                      </Link>
                      <Link
                        to="/payment-history"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors font-semibold"
                      >
                        <FaReceipt className="text-xs text-primary-400" /> Payment History
                      </Link>
                      {user?.role === 'passenger' && (
                        <Link
                          to="/bookings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors font-semibold"
                        >
                          <FaCog className="text-xs text-primary-400" /> My Bookings
                        </Link>
                      )}
                      {user?.role === 'driver' && (
                        <Link
                          to="/driver/rides"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors font-semibold"
                        >
                          <FaCar className="text-xs text-primary-400" /> My Rides & Roster
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-red-500/10 rounded-lg text-red-400 transition-colors font-bold text-left cursor-pointer"
                      >
                        <FaSignOutAlt className="text-xs" /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Hamburger Menu Toggle (Mobile) */}
          <div className="md:hidden flex items-center gap-4 relative z-50">
            {isAuthenticated && (
              <Link to="/notifications" className="text-gray-400 hover:text-white relative">
                <FaBell />
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-400 hover:text-white transition-colors p-1 cursor-pointer"
            >
              {mobileMenuOpen ? <FaTimes className="text-lg" /> : <FaBars className="text-lg" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden border-t border-white/5 bg-dark-950 rounded-b-2xl overflow-hidden"
          >
            <div className="px-4 pt-4 pb-6 space-y-3 flex flex-col">
              {!isAuthenticated ? (
                <>
                  <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white font-bold py-2 text-base border-b border-white/5">Home</Link>
                  <Link to="/search" onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white font-bold py-2 text-base border-b border-white/5">Search Rides</Link>
                  <span className="text-gray-400 hover:text-white font-bold py-2 text-base border-b border-white/5 cursor-pointer">About</span>
                  <span className="text-gray-400 hover:text-white font-bold py-2 text-base border-b border-white/5 cursor-pointer">Contact</span>
                  <div className="flex gap-4 pt-2">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center"><AnimatedButton variant="secondary" fullWidth>Log In</AnimatedButton></Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center"><AnimatedButton variant="primary" fullWidth>Sign Up</AnimatedButton></Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 mb-2">
                    <img
                      src={user?.avatar || 'https://res.cloudinary.com/demo/image/upload/v1/default-avatar.png'}
                      alt={user?.name}
                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                    />
                    <div>
                      <p className="text-sm font-black text-white leading-tight">{user?.name}</p>
                      <p className="text-xs text-primary-400 font-bold uppercase tracking-wider">{user?.ecoLevel || 'Seedling'} • {user?.ecoPoints || 0} Points</p>
                    </div>
                  </div>

                  <Link to={getDashboardPath()} onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white font-semibold py-2 text-base border-b border-white/5">Dashboard</Link>
                  
                  {user?.role === 'driver' && (
                    <Link to="/driver/publish-ride" onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white font-semibold py-2 text-base border-b border-white/5">Publish Ride</Link>
                  )}
                  
                  <Link to="/search" onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white font-semibold py-2 text-base border-b border-white/5">Search Rides</Link>
                  <Link to="/chat" onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white font-semibold py-2 text-base border-b border-white/5">Messages</Link>
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white font-semibold py-2 text-base border-b border-white/5">Profile</Link>
                                    {user?.role === 'passenger' && (
                    <Link to="/bookings" onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white font-semibold py-2 text-base border-b border-white/5">My Bookings</Link>
                  )}
                  {user?.role === 'driver' && (
                    <Link to="/driver/rides" onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white font-semibold py-2 text-base border-b border-white/5">My Rides & Roster</Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full btn-secondary text-red-400 border border-red-500/10 hover:bg-red-500/10 py-3 text-center rounded-xl text-sm font-bold mt-4 cursor-pointer"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

export default Navbar