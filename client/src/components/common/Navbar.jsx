import { Link } from 'react-router-dom'
import { FaLeaf } from 'react-icons/fa'

const Navbar = () => {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <FaLeaf className="text-primary text-2xl" />
            <span className="text-black font-bold text-xl tracking-tight">EcoRide AI</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/search" className="text-black font-medium hover:text-gray-600">Ride</Link>
            <Link to="/driver/publish-ride" className="text-black font-medium hover:text-gray-600">Drive</Link>
            <Link to="/" className="text-black font-medium hover:text-gray-600">About</Link>
          </div>

          {/* Right Side Buttons */}
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-black font-medium hover:text-gray-600">Log in</Link>
            <Link to="/register" className="bg-black text-white px-4 py-2 rounded-full font-medium hover:bg-gray-800 transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar