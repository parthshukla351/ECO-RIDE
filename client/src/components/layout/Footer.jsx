import { Link } from 'react-router-dom'
import { FaLeaf, FaGithub, FaTwitter, FaLinkedin, FaHeart } from 'react-icons/fa'

const Footer = () => {
  return (
    <footer className="bg-dark-950/60 border-t border-white/5 mt-auto relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/10">
                <FaLeaf className="text-white text-sm" />
              </div>
              <span className="text-xl font-black font-display text-white tracking-tight">
                EcoRide <span className="text-primary-500">AI</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm mb-4 max-w-sm leading-relaxed">
              The smart, sustainable ride-sharing platform powered by AI. 
              Join thousands reducing emissions while saving money.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 bg-white/5 hover:bg-primary-500 rounded-lg flex items-center justify-center transition-all hover:scale-105">
                <FaGithub className="text-gray-400 hover:text-white" />
              </a>
              <a href="#" className="w-8 h-8 bg-white/5 hover:bg-primary-500 rounded-lg flex items-center justify-center transition-all hover:scale-105">
                <FaTwitter className="text-gray-400 hover:text-white" />
              </a>
              <a href="#" className="w-8 h-8 bg-white/5 hover:bg-primary-500 rounded-lg flex items-center justify-center transition-all hover:scale-105">
                <FaLinkedin className="text-gray-400 hover:text-white" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/search" className="text-gray-400 hover:text-primary-400 transition-colors">Find Rides</Link></li>
              <li><Link to="/register" className="text-gray-400 hover:text-primary-400 transition-colors">Become a Driver</Link></li>
              <li><Link to="/" className="text-gray-400 hover:text-primary-400 transition-colors">How It Works</Link></li>
              <li><Link to="/" className="text-gray-400 hover:text-primary-400 transition-colors">Safety First</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-gray-400 hover:text-primary-400 transition-colors">Help Center</Link></li>
              <li><Link to="/" className="text-gray-400 hover:text-primary-400 transition-colors">Contact Us</Link></li>
              <li><Link to="/" className="text-gray-400 hover:text-primary-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/" className="text-gray-400 hover:text-primary-400 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>
            © {new Date().getFullYear()} EcoRide AI. All rights reserved.
          </p>
          <p className="flex items-center gap-1 mt-2 md:mt-0">
            Made with <FaHeart className="text-primary-500 animate-pulse" /> for a greener planet
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
