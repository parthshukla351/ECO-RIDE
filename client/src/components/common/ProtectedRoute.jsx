import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Loading EcoRide AI...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user && !user.profileCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const dashboardPath = user?.role === 'driver' ? '/driver/dashboard' 
                        : user?.role === 'admin' ? '/admin' 
                        : '/dashboard'
    return <Navigate to={dashboardPath} replace />
  }

  return <Outlet />
}

export default ProtectedRoute