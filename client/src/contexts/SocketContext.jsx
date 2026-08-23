import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext()

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([])
  const { token, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated && token) {
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        auth: { token },
        transports: ['websocket', 'polling']
      })

      newSocket.on('connect', () => {
        console.log('🔌 Socket connected:', newSocket.id)
      })

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message)
      })

      setSocket(newSocket)

      return () => {
        newSocket.disconnect()
        setSocket(null)
      }
    }
  }, [isAuthenticated, token])

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) throw new Error('useSocket must be used within SocketProvider')
  return context
}

export default SocketContext