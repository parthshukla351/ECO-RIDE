import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaPaperPlane, FaArrowLeft, FaCircle, FaImage,
  FaMapMarkerAlt, FaEllipsisV, FaPhone, FaSmile
} from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-64px)] bg-white flex">
      {/* Chat List Sidebar */}
      <div className={`${
        showChatList ? 'flex' : 'hidden md:flex'
      } flex-col w-full md:w-96 border-r border-gray-800 bg-gray-900`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Messages</h2>
          <p className="text-gray-400 text-sm">{chats.length} conversation{chats.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="text-5xl mb-4">💬</div>
              <p className="text-gray-400">No conversations yet</p>
              <p className="text-gray-500 text-sm mt-2">
                Book a ride to start chatting with drivers
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
                  className={`w-full flex items-center gap-3 p-4 hover:bg-gray-800 transition-colors text-left border-b border-gray-800/50 ${
                    isActive ? 'bg-gray-800 border-l-2 border-l-primary-500' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={other.avatar || 'https://via.placeholder.com/40'}
                      alt={other.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-700"
                    />
                    {other.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-white font-medium truncate">{other.name}</h3>
                      <span className="text-gray-500 text-xs flex-shrink-0">
                        {chat.lastMessage && formatTime(chat.updatedAt)}
                      </span>
                    </div>
                    
                    {chat.ride && (
                      <p className="text-primary-400 text-xs mb-1 truncate">
                        {chat.ride.origin?.city} → {chat.ride.destination?.city}
                      </p>
                    )}

                    <p className="text-gray-400 text-sm truncate">
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
      } flex-col flex-1 bg-gray-950`}>
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-4 p-4 border-b border-gray-800 bg-gray-900">
              <button
                onClick={() => setShowChatList(true)}
                className="md:hidden text-gray-400 hover:text-white"
              >
                <FaArrowLeft />
              </button>
              
              <div className="relative">
                <img
                  src={getOtherParticipant(activeChat).avatar || 'https://via.placeholder.com/40'}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover border-2 border-primary-500"
                />
                {getOtherParticipant(activeChat).isOnline && (
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-900"></div>
                )}
              </div>

              <div className="flex-1">
                <h3 className="text-white font-semibold">
                  {getOtherParticipant(activeChat).name}
                </h3>
                <p className="text-xs text-gray-400">
                  {typingUser ? (
                    <span className="text-primary-400">{typingUser} is typing...</span>
                  ) : getOtherParticipant(activeChat).isOnline ? (
                    <span className="text-green-400 flex items-center gap-1">
                      <FaCircle className="text-[6px]" /> Online
                    </span>
                  ) : (
                    'Offline'
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${getOtherParticipant(activeChat).phone}`}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <FaPhone />
                </a>
                {activeChat.ride && (
                  <Link
                    to={`/ride/${activeChat.ride._id}`}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    title="View Ride"
                  >
                    <FaEllipsisV />
                  </Link>
                )}
              </div>
            </div>

            {/* Ride Info Banner */}
            {activeChat.ride && (
              <div className="px-4 py-2 bg-primary-500/10 border-b border-primary-500/20">
                <Link 
                  to={`/ride/${activeChat.ride._id}`}
                  className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300"
                >
                  🚗 {activeChat.ride.origin?.city} → {activeChat.ride.destination?.city}
                  <span className="text-primary-500/50">•</span>
                  <span className="capitalize">{activeChat.ride.status}</span>
                </Link>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {Object.entries(groupMessagesByDate(messages)).map(([date, msgs]) => (
                <div key={date}>
                  {/* Date Separator */}
                  <div className="flex items-center justify-center my-4">
                    <div className="px-3 py-1 bg-gray-800 rounded-full text-gray-400 text-xs">
                      {date}
                    </div>
                  </div>

                  {/* Messages */}
                  {msgs.map((message, index) => {
                    const isMine = message.sender?._id === user?._id
                    
                    return (
                      <motion.div
                        key={message._id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex mb-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        {/* Other user avatar */}
                        {!isMine && (
                          <img
                            src={message.sender?.avatar || 'https://via.placeholder.com/32'}
                            alt=""
                            className="w-8 h-8 rounded-full mr-2 mt-1 flex-shrink-0"
                          />
                        )}

                        <div className={`max-w-[70%] ${isMine ? 'order-1' : 'order-2'}`}>
                          {/* Message Bubble */}
                          <div className={`px-4 py-2.5 rounded-2xl ${
                            isMine
                              ? 'bg-primary-500 text-white rounded-br-md'
                              : 'bg-gray-800 text-gray-100 rounded-bl-md'
                          }`}>
                            {/* Location Message */}
                            {message.messageType === 'location' ? (
                              <div>
                                <p className="text-sm">{message.content}</p>
                                {message.location && (
                                  <a
                                    href={`https://www.google.com/maps?q=${message.location.lat},${message.location.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`text-xs mt-1 inline-flex items-center gap-1 ${
                                      isMine ? 'text-green-200' : 'text-primary-400'
                                    }`}
                                  >
                                    <FaMapMarkerAlt /> Open in Maps
                                  </a>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                            )}
                          </div>

                          {/* Time & Read Status */}
                          <div className={`flex items-center gap-1 mt-1 ${
                            isMine ? 'justify-end' : 'justify-start'
                          }`}>
                            <span className="text-[10px] text-gray-500">
                              {formatTime(message.createdAt)}
                            </span>
                            {isMine && message.isRead && (
                              <span className="text-[10px] text-primary-400">✓✓</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ))}

              {/* Typing Indicator */}
              <AnimatePresence>
                {typingUser && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 ml-10"
                  >
                    <div className="bg-gray-800 px-4 py-2 rounded-2xl rounded-bl-md">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-800 bg-gray-900">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                {/* Location Button */}
                <button
                  type="button"
                  onClick={handleSendLocation}
                  className="p-2 text-gray-400 hover:text-primary-400 hover:bg-gray-800 rounded-lg transition-colors"
                  title="Share Location"
                >
                  <FaMapMarkerAlt />
                </button>

                {/* Input */}
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value)
                      handleTyping()
                    }}
                    placeholder="Type a message..."
                    className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    maxLength={1000}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-400"
                  >
                    <FaSmile />
                  </button>
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendingMessage}
                  className={`p-3 rounded-xl transition-all ${
                    newMessage.trim()
                      ? 'bg-primary-500 hover:bg-primary-400 text-white'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <FaPaperPlane className={sendingMessage ? 'animate-pulse' : ''} />
                </button>
              </form>
            </div>
          </>
        ) : (
          /* No Chat Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-bold text-white mb-2">Select a conversation</h3>
              <p className="text-gray-400">Choose a chat from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Chat