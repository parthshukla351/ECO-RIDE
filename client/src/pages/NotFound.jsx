import { Link } from 'react-router-dom'
import { FaLeaf, FaHome } from 'react-icons/fa'

const NotFound = () => (
  <div className="min-h-screen bg-white flex items-center justify-center text-center px-4">
    <div>
      <div className="text-8xl font-black text-gradient mb-4">404</div>
      <div className="text-4xl mb-4">🌱</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
      <p className="text-gray-500 mb-8">This route doesn't exist in our green network.</p>
      <Link to="/" className="btn-primary inline-flex items-center gap-2">
        <FaHome /> Go Home
      </Link>
    </div>
  </div>
)

export default NotFound