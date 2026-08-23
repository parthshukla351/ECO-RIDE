import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaPaperPlane, FaArrowLeft, FaCircle, FaImage,
  FaMapMarkerAlt, FaEllipsisV, FaPhone, FaSmile
} from 'react-icons/fa'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import GlassCard from '../components/ui/GlassCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import api from '../services/api'
import toast from 'react-hot-toast'

const Chat = () => {
  const { chatId } = useParams()
  const { user } = useAuth()
  const { socket } = useSocket()
  
  const [chats, setChats] = useState([])
  const [activeChat, setActiveChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [typingUser, setTypingUser] = useState(null)
  const [showChatList, setShowChatList] = useState(!chatId)
  
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const inputRef = useRef(null)

  // Fetch all chats
  useEffect(() => {
    fetchChats()
  }, [])

  // Join chat room when active chat changes
  useEffect(() => {
    if (activeChat && socket) {
      socket.emit('joinChat', activeChat._id)
      fetchMessages(activeChat._id)
      markAsRead(activeChat._id)
    }
  }, [activeChat, socket])

  // Listen for new messages
  useEffect(() => {
    if (!socket) return

    socket.on('newMessage', ({ chatId: incomingChatId, message }) => {
      if (activeChat && activeChat._id === incomingChatId) {
        setMessages(prev => [...prev, message])
        scrollToBottom()
        markAsRead(incomingChatId)
      }
      
      // Update chat list
      setChats(prev => prev.map(chat => 
        chat._id === incomingChatId 
          ? { ...chat, lastMessage: message, updatedAt: new Date() }
          : chat
      ))
    })

    socket.on('userTyping', ({ userId, name, isTyping }) => {
      if (isTyping) {
        setTypingUser(name)
      } else {
        setTypingUser(null)
      }
    })

    return () => {
      socket.off('newMessage')
      socket.off('userTyping')
    }
  }, [socket, activeChat])

  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchChats = async () => {
    try {
      const { data } = await api.get('/chat')
      setChats(data.chats)
      
      if (chatId) {
        const chat = data.chats.find(c => c._id === chatId || c.ride?._id === chatId)
        if (chat) {
          setActiveChat(chat)
          setShowChatList(false)
        }
      }
    } catch (error) {
      toast.error('Failed to load chats')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (id) => {
    try {
      const { data } = await api.get(`/chat/${id}/messages`)
      setMessages(data.messages)
    } catch (error) {
      toast.error('Failed to load messages')
    }
  }

  const markAsRead = async (id) => {
    try {
      await api.put(`/chat/${id}/read`)
    } catch (error) {
      console.error('Mark as read failed')
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeChat) return

    setSendingMessage(true)
    try {
      const { data } = await api.post(`/chat/${activeChat._id}/message`, {
        content: newMessage.trim()
      })
      
      setMessages(prev => [...prev, data.message])
      setNewMessage('')
      scrollToBottom()
      inputRef.current?.focus()

      // Emit via socket
      if (socket) {
        socket.emit('sendMessage', {
          chatId: activeChat._id,
          ...data.message
        })
      }
    } catch (error) {
      toast.error('Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleTyping = () => {
    if (!socket || !activeChat) return
    
    socket.emit('typing', { chatId: activeChat._id, isTyping: true })
    
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { chatId: activeChat._id, isTyping: false })
    }, 2000)
  }

  const handleSendLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported')
      return
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { data } = await api.post(`/chat/${activeChat._id}/message`, {
          content: `📍 Location: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
          messageType: 'location',
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        })
        setMessages(prev => [...prev, data.message])
        scrollToBottom()
      } catch (error) {
        toast.error('Failed to share location')
      }
    }, () => {
      toast.error('Location permission denied')
    })
  }

  const getOtherParticipant = (chat) => {
    return chat?.participants?.find(p => p._id !== user?._id) || {}
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (date) => {
    const today = new Date()
    const msgDate = new Date(date)
    
    if (msgDate.toDateString() === today.toDateString()) return 'Today'
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (msgDate.toDateString() === yesterday.toDateString()) return 'Yesterday'
    
    return msgDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  const groupMessagesByDate = (msgs) => {
    const groups = {}
    msgs.forEach(msg => {
      const date = formatDate(msg.createdAt)
      if (!groups[date]) groups[date] = []
      groups[date].push(msg)
    })
    return groups
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-140px)] bg-dark-950 border border-white/5 rounded-3xl overflow-hidden flex shadow-2xl">
      {/* Chat List Sidebar */}
      <div className={`${
        showChatList ? 'flex' : 'hidden md:flex'
      } flex-col w-full md:w-96 border-r border-white/5 bg-dark-900/50 backdrop-blur-md`}>
        {/* Sidebar Header */}
        <div className="p-5 border-b border-white/5">
          <h2 className="text-xl font-black font-display text-white tracking-tight">Messages</h2>
          <p className="text-gray-500 text-xs mt-1 font-semibold">{chats.length} active conversation{chats.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chats.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <div className="text-4xl opacity-35">💬</div>
              <p className="text-gray-400 text-sm font-semibold">No active conversations</p>
              <p className="text-gray-500 text-xs leading-relaxed">
                Start sharing rides and booking commutes to message driver networks.
              </p>
            </div>
          ) : (
            chats.map(chat => {
              const other = getOtherParticipant(chat)
              const isActive = activeChat?._id === chat._id
              
              return (
                <button
                  key={chat._id}
                  onClick={() => {
                    setActiveChat(chat)
                    setShowChatList(false)
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all text-left border border-transparent ${
                    isActive ? 'bg-primary-500/10 border-primary-500/10 text-white' : 'text-gray-400'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={other.avatar || 'https://res.cloudinary.com/demo/image/upload/v1/default-avatar.png'}
                      alt={other.name}
                      className="w-11 h-11 rounded-full object-cover border border-white/10"
                    />
                    {other.isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-dark-900"></span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-white font-bold text-sm truncate">{other.name}</h4>
                      <span className="text-gray-500 text-[10px] font-bold">
                        {chat.lastMessage && formatTime(chat.updatedAt)}
                      </span>
                    </div>
                    
                    {chat.ride && (
                      <span className="text-primary-400 text-[10px] font-black uppercase tracking-wider block mb-0.5">
                        {chat.ride.origin?.city} → {chat.ride.destination?.city}
                      </span>
                    )}

                    <p className="text-gray-400 text-xs truncate font-medium">
                      {chat.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`${
        !showChatList ? 'flex' : 'hidden md:flex'
      } flex-col flex-1 bg-dark-950/80`}>
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-4 p-4 border-b border-white/5 bg-dark-900/40">
              <button
                onClick={() => setShowChatList(true)}
                className="md:hidden text-gray-400 hover:text-white p-1"
              >
                <FaArrowLeft />
              </button>
              
              <div className="relative">
                <img
                  src={getOtherParticipant(activeChat).avatar || 'https://res.cloudinary.com/demo/image/upload/v1/default-avatar.png'}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover border border-white/10"
                />
                {getOtherParticipant(activeChat).isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-dark-900"></span>
                )}
              </div>

              <div className="flex-1">
                <h3 className="text-white font-bold text-sm">{getOtherParticipant(activeChat).name}</h3>
                <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5">
                  {typingUser ? (
                    <span className="text-primary-400">{typingUser} is typing...</span>
                  ) : getOtherParticipant(activeChat).isOnline ? (
                    <span className="text-green-400 flex items-center gap-1">
                      <FaCircle className="text-[5px] animate-pulse" /> Active Now
                    </span>
                  ) : (
                    <span className="text-gray-500">Offline</span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${getOtherParticipant(activeChat).phone}`}
                  className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  <FaPhone className="text-xs" />
                </a>
                {activeChat.ride && (
                  <Link
                    to={`/ride/${activeChat.ride._id}`}
                    className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    title="View Ride Details"
                  >
                    <FaEllipsisV className="text-xs" />
                  </Link>
                )}
              </div>
            </div>

            {/* Ride Route Banner */}
            {activeChat.ride && (
              <div className="px-5 py-2.5 bg-primary-500/10 border-b border-primary-500/15">
                <Link 
                  to={`/ride/${activeChat.ride._id}`}
                  className="flex items-center gap-2 text-xs font-bold text-primary-400 uppercase tracking-wider"
                >
                  🚗 {activeChat.ride.origin?.city} → {activeChat.ride.destination?.city}
                  <span className="text-primary-500/40">•</span>
                  <span className="text-[10px] font-black">{activeChat.ride.status}</span>
                </Link>
              </div>
            )}

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {Object.entries(groupMessagesByDate(messages)).map(([date, msgs]) => (
                <div key={date} className="space-y-4">
                  {/* Date Badge */}
                  <div className="flex justify-center">
                    <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-gray-500 text-[10px] font-black uppercase tracking-wider">
                      {date}
                    </span>
                  </div>

                  {/* Messages */}
                  {msgs.map((message, index) => {
                    const isMine = message.sender?._id === user?._id
                    
                    return (
                      <motion.div
                        key={message._id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMine && (
                          <img
                            src={message.sender?.avatar || 'https://res.cloudinary.com/demo/image/upload/v1/default-avatar.png'}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-white/10 mr-2 mt-0.5 flex-shrink-0"
                          />
                        )}

                        <div className={`max-w-[70%] ${isMine ? 'order-1' : 'order-2'}`}>
                          {/* Bubble */}
                          <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium ${
                            isMine
                              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-br-none'
                              : 'bg-dark-900 border border-white/5 text-gray-100 rounded-bl-none'
                          }`}>
                            {message.messageType === 'location' ? (
                              <div className="space-y-2">
                                <p className="text-xs leading-relaxed font-semibold">{message.content}</p>
                                {message.location && (
                                  <a
                                    href={`https://www.google.com/maps?q=${message.location.lat},${message.location.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider ${
                                      isMine ? 'text-green-200 hover:text-white' : 'text-primary-400 hover:text-primary-300'
                                    }`}
                                  >
                                    <FaMapMarkerAlt /> View on Maps
                                  </a>
                                )}
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap break-words leading-relaxed">
                                {message.content}
                              </p>
                            )}
                          </div>

                          {/* Time tag */}
                          <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[9px] text-gray-500 font-bold">
                              {formatTime(message.createdAt)}
                            </span>
                            {isMine && message.isRead && (
                              <span className="text-[9px] text-primary-400 font-bold">✓✓</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ))}

              {/* Typing indicator */}
              <AnimatePresence>
                {typingUser && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 ml-10"
                  >
                    <div className="bg-dark-900 border border-white/5 px-4 py-2.5 rounded-2xl rounded-bl-none">
                      <div className="flex gap-1.5 items-center">
                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-white/5 bg-dark-900/40">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSendLocation}
                  className="p-2.5 text-gray-400 hover:text-primary-400 hover:bg-white/5 border border-white/5 rounded-xl transition-all cursor-pointer"
                  title="Share Live Coordinates"
                >
                  <FaMapMarkerAlt />
                </button>

                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value)
                      handleTyping()
                    }}
                    placeholder="Write your message..."
                    className="w-full bg-dark-950/80 border border-white/5 text-white placeholder-gray-500 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-primary-500/40 transition-all font-medium text-sm"
                    maxLength={1000}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-yellow-400 p-1 cursor-pointer"
                  >
                    <FaSmile />
                  </button>
                </div>

                <AnimatedButton
                  type="submit"
                  variant="primary"
                  disabled={!newMessage.trim() || sendingMessage}
                  className="p-3.5 rounded-xl"
                >
                  <FaPaperPlane className={`text-xs ${sendingMessage ? 'animate-pulse' : ''}`} />
                </AnimatedButton>
              </form>
            </div>
          </>
        ) : (
          /* Empty Chat View */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3 p-6 max-w-sm">
              <div className="text-5xl opacity-35">💬</div>
              <h3 className="text-xl font-bold text-white font-display">Select Conversation</h3>
              <p className="text-gray-400 text-xs leading-relaxed font-medium">Choose a passenger or driver chat from the left sidebar to coordinate transit details.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Chat
