import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  const fetchUser = async () => {
    try {
      const { data } = await api.get('/auth/me')
      setUser(data.user)
    } catch {
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password })
      
      if (data.needsVerification) {
        return { needsVerification: true, userId: data.userId }
      }

      localStorage.setItem('token', data.token)
      setToken(data.token)
      setUser(data.user)
      toast.success(`Welcome back, ${data.user.name}! 🌱`)
      return { success: true, user: data.user }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      return { success: false, message }
    }
  }

  const register = async (userData) => {
    try {
      const { data } = await api.post('/auth/register', userData)
      toast.success('Registration successful! Check your email for OTP.')
      return { success: true, userId: data.userId }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed'
      toast.error(message)
      return { success: false, message }
    }
  }

  const verifyOTP = async (userId, otp) => {
    try {
      const { data } = await api.post('/auth/verify-otp', { userId, otp })
      localStorage.setItem('token', data.token)
      setToken(data.token)
      setUser(data.user)
      toast.success('Email verified! Welcome to EcoRide AI 🌱')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'OTP verification failed'
      toast.error(message)
      return { success: false, message }
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore logout errors
    }
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    toast.success('Logged out successfully')
  }

  const updateUser = (updatedUser) => {
    setUser(prev => ({ ...prev, ...updatedUser }))
  }

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, register, verifyOTP, logout,
      updateUser, fetchUser,
      isAuthenticated: !!user,
      isDriver: user?.role === 'driver',
      isPassenger: user?.role === 'passenger',
      isAdmin: user?.role === 'admin'
    }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export default AuthContext