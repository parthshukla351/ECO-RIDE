import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import CommandPalette from './components/ui/CommandPalette'

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
import Onboarding from './pages/Onboarding'
import AdminDashboard from './pages/admin/AdminDashboard'
import NotFound from './pages/NotFound'

// Payments & Wallet Pages
import Checkout from './pages/Checkout'
import Wallet from './pages/Wallet'
import PaymentHistory from './pages/PaymentHistory'

// Safety & Trust Pages
import EmergencyContacts from './pages/EmergencyContacts'
import ShareTracking from './pages/ShareTracking'

// AI Assistant Page
import AiAssistant from './pages/AiAssistant'
import CarbonDashboard from './pages/CarbonDashboard'
import RewardStore from './pages/RewardStore'
import DriverInsights from './pages/DriverInsights'
import RequestRide from './pages/RequestRide'
import OnDemandTracking from './pages/OnDemandTracking'

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-dark-950 text-gray-200 flex flex-col relative overflow-hidden bg-hero selection:bg-primary-500/20 selection:text-primary-400">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-[160px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[160px] pointer-events-none" />

            <Navbar />
            <CommandPalette />
            
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-otp" element={<VerifyOTP />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/search" element={<SearchRide />} />
                <Route path="/ride/:id" element={<RideDetails />} />
                <Route path="/share/:token" element={<ShareTracking />} />

                {/* Protected - All users */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/chat/:chatId" element={<Chat />} />
                  <Route path="/bookings" element={<MyBookings />} />
                  <Route path="/checkout/:bookingId" element={<Checkout />} />
                  <Route path="/wallet" element={<Wallet />} />
                  <Route path="/payment-history" element={<PaymentHistory />} />
                  <Route path="/safety/contacts" element={<EmergencyContacts />} />
                  <Route path="/ai-assistant" element={<AiAssistant />} />
                  <Route path="/carbon-analytics" element={<CarbonDashboard />} />
                  <Route path="/rewards" element={<RewardStore />} />
                </Route>

                {/* Protected - Passenger */}
                <Route element={<ProtectedRoute allowedRoles={['passenger']} />}>
                  <Route path="/dashboard" element={<PassengerDashboard />} />
                  <Route path="/request-ride" element={<RequestRide />} />
                  <Route path="/ondemand/tracking/:requestId" element={<OnDemandTracking />} />
                </Route>

                {/* Protected - Driver */}
                <Route element={<ProtectedRoute allowedRoles={['driver']} />}>
                  <Route path="/driver/dashboard" element={<DriverDashboard />} />
                  <Route path="/driver/publish-ride" element={<PublishRide />} />
                  <Route path="/driver/rides" element={<MyRides />} />
                  <Route path="/driver/insights" element={<DriverInsights />} />
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