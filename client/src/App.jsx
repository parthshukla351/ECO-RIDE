import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import Navbar from './components/common/Navbar'
import Footer from './components/common/Footer'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyOTP from './pages/VerifyOTP'
import ForgotPassword from './pages/ForgotPassword'
import SearchRide from './pages/SearchRide'
import RideDetails from './pages/RideDetails'
import PassengerDashboard from './pages/PassengerDashboard'
import DriverDashboard from './pages/DriverDashboard'
import PublishRide from './pages/PublishRide'
import MyRides from './pages/MyRides'
import MyBookings from './pages/MyBookings'
import Profile from './pages/Profile'
import Chat from './pages/Chat'
import Notifications from './pages/Notifications'
import AdminDashboard from './pages/admin/AdminDashboard'
import NotFound from './pages/NotFound'

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-white flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-otp" element={<VerifyOTP />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/search" element={<SearchRide />} />
                <Route path="/ride/:id" element={<RideDetails />} />

                {/* Protected - All users */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/chat/:chatId" element={<Chat />} />
                  <Route path="/bookings" element={<MyBookings />} />
                </Route>

                {/* Protected - Passenger */}
                <Route element={<ProtectedRoute allowedRoles={['passenger']} />}>
                  <Route path="/dashboard" element={<PassengerDashboard />} />
                </Route>

                {/* Protected - Driver */}
                <Route element={<ProtectedRoute allowedRoles={['driver']} />}>
                  <Route path="/driver/dashboard" element={<DriverDashboard />} />
                  <Route path="/driver/publish-ride" element={<PublishRide />} />
                  <Route path="/driver/rides" element={<MyRides />} />
                </Route>

                {/* Protected - Admin */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="/admin/*" element={<AdminDashboard />} />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App