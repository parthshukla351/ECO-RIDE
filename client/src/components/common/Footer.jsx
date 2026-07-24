import { Link } from 'react-router-dom'
import { FaLeaf, FaGithub, FaTwitter, FaLinkedin, FaHeart } from 'react-icons/fa'

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                <FaLeaf className="text-white text-lg" />
              </div>
              <span className="text-xl font-black text-gray-900">
                EcoRide <span className="text-primary-500">AI</span>
              </span>
            </Link>
            <p className="text-gray-500 text-sm mb-4 max-w-sm">
              The smart, sustainable ride-sharing platform powered by AI. 
              Join thousands reducing emissions while saving money.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 bg-gray-200 hover:bg-primary-500 rounded-lg flex items-center justify-center transition-colors">
                <FaGithub className="text-gray-600 hover:text-white" />
              </a>
              <a href="#" className="w-9 h-9 bg-gray-200 hover:bg-primary-500 rounded-lg flex items-center justify-center transition-colors">
                <FaTwitter className="text-gray-600 hover:text-white" />
              </a>
              <a href="#" className="w-9 h-9 bg-gray-200 hover:bg-primary-500 rounded-lg flex items-center justify-center transition-colors">
                <FaLinkedin className="text-gray-600 hover:text-white" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/search" className="text-gray-500 hover:text-primary-600 text-sm">Find Rides</Link></li>
              <li><Link to="/register" className="text-gray-500 hover:text-primary-600 text-sm">Become a Driver</Link></li>
              <li><Link to="/" className="text-gray-500 hover:text-primary-600 text-sm">How It Works</Link></li>
              <li><Link to="/" className="text-gray-500 hover:text-primary-600 text-sm">Safety</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-500 hover:text-primary-600 text-sm">Help Center</Link></li>
              <li><Link to="/" className="text-gray-500 hover:text-primary-600 text-sm">Contact Us</Link></li>
              <li><Link to="/" className="text-gray-500 hover:text-primary-600 text-sm">Privacy Policy</Link></li>
              <li><Link to="/" className="text-gray-500 hover:text-primary-600 text-sm">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 EcoRide AI. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm flex items-center gap-1 mt-2 md:mt-0">
            Made with <FaHeart className="text-red-500" /> for a greener planet
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
