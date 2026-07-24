import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FaBell, FaCheckDouble, FaTrash, FaCar, FaLeaf,
  FaMoneyBillWave, FaStar, FaExclamationTriangle
} from 'react-icons/fa'
import api from '../services/api'
import toast from 'react-hot-toast'

const Notifications = () => {
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/notifications')
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch (error) {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => 
        n._id === id ? { ...n, isRead: true } : n
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      toast.error('Failed to mark as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast.success('All marked as read')
    } catch (error) {
      toast.error('Failed to mark all as read')
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`)
      setNotifications(prev => prev.filter(n => n._id !== id))
      toast.success('Notification deleted')
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_confirmed':
      case 'booking_cancelled':
      case 'booking_rejected':
        return <FaCar className="text-blue-400" />
      case 'ride_started':
      case 'ride_completed':
      case 'ride_cancelled':
        return <FaCar className="text-green-400" />
      case 'payment_success':
      case 'payment_failed':
      case 'refund_processed':
        return <FaMoneyBillWave className="text-yellow-400" />
      case 'review_received':
        return <FaStar className="text-yellow-400" />
      case 'eco_badge_earned':
      case 'eco_level_up':
        return <FaLeaf className="text-green-400" />
      case 'sos_alert':
        return <FaExclamationTriangle className="text-red-400" />
      default:
        return <FaBell className="text-gray-400" />
    }
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead
    if (filter === 'read') return n.isRead
    return true
  })

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
              <FaBell className="text-primary-400" />
              Notifications
            </h1>
            <p className="text-gray-400">
              {unreadCount > 0 ? (
                <span>{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</span>
              ) : (
                'All caught up!'
              )}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="btn-outline text-sm flex items-center gap-2"
            >
              <FaCheckDouble /> Mark All Read
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {[
            { value: 'all', label: 'All' },
            { value: 'unread', label: 'Unread' },
            { value: 'read', label: 'Read' }
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === tab.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {tab.label}
              {tab.value === 'unread' && unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-primary-400 text-white text-xs rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="card text-center py-12">
            <FaBell className="text-gray-600 text-5xl mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No notifications</h3>
            <p className="text-gray-400">
              {filter === 'all' 
                ? "You don't have any notifications yet" 
                : `No ${filter} notifications`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
                className={`card cursor-pointer transition-all ${
                  !notification.isRead 
                    ? 'border-primary-500/50 bg-primary-500/5' 
                    : 'hover:border-gray-700'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <h3 className="text-white font-semibold">{notification.title}</h3>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-2">{notification.message}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(notification._id)
                        }}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Link */}
                {notification.data?.rideId && (
                  <Link
                    to={`/ride/${notification.data.rideId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 btn-outline text-sm inline-flex items-center gap-2"
                  >
                    View Ride →
                  </Link>
                )}
                {notification.data?.bookingId && (
                  <Link
                    to={`/bookings`}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 btn-outline text-sm inline-flex items-center gap-2"
                  >
                    View Booking →
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Notifications