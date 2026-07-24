import { FaLeaf } from 'react-icons/fa'

const Loader = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <div className="relative inline-block">
          <div className="w-16 h-16 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <FaLeaf className="text-primary-400 text-xl animate-pulse" />
          </div>
        </div>
        <p className="text-gray-400 mt-4">{message}</p>
      </div>
    </div>
  )
}

export default Loader