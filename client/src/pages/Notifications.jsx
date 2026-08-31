import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FaBell, FaCheckDouble, FaTrash, FaCar, FaLeaf,
  FaMoneyBillWave, FaStar, FaExclamationTriangle
} from 'react-icons/fa'
import GlassCard from '../components/ui/GlassCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

const Notifications = () => {
  const { user } = useAuth()
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
      toast.success('All notifications marked as read')
    } catch (error) {
      toast.error('Failed to mark all as read')
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`)
      setNotifications(prev => prev.filter(n => n._id !== id))
      toast.success('Notification removed')
    } catch (error) {
      toast.error('Failed to delete notification')
    }
  }

  const handlePassengerApprove = async (e, bookingId, notificationId) => {
    e.stopPropagation();
    try {
      const { data } = await api.put(`/bookings/${bookingId}/passenger-approve`);
      if (data.success) {
        toast.success('Share approved! Sent to driver.');
        handleMarkAsRead(notificationId);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve share request');
    }
  };

  const handlePassengerDeny = async (e, bookingId, notificationId) => {
    e.stopPropagation();
    try {
      const { data } = await api.put(`/bookings/${bookingId}/passenger-deny`);
      if (data.success) {
        toast.success('Share request denied.');
        handleMarkAsRead(notificationId);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to deny share request');
    }
  };

  const handleDriverApprove = async (e, bookingId, notificationId) => {
    e.stopPropagation();
    try {
      const { data } = await api.put(`/bookings/${bookingId}/confirm`);
      if (data.success) {
        toast.success('Shared ride passenger confirmed!');
        handleMarkAsRead(notificationId);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to confirm booking');
    }
  };

  const handleDriverDecline = async (e, bookingId, notificationId) => {
    e.stopPropagation();
    try {
      const { data } = await api.put(`/bookings/${bookingId}/reject`);
      if (data.success) {
        toast.success('Booking request declined.');
        handleMarkAsRead(notificationId);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to decline booking');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_confirmed':
      case 'booking_cancelled':
      case 'booking_rejected':
        return <FaCar className="text-cyan-400" />
      case 'ride_started':
      case 'ride_completed':
      case 'ride_cancelled':
        return <FaCar className="text-primary-400" />
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
    <div className="space-y-8 pb-12 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-black font-display text-white tracking-tight flex items-center gap-3">
            <FaBell className="text-primary-400" /> Notifications
          </h1>
          <p className="text-gray-400 text-sm font-medium mt-1">
            {unreadCount > 0 ? (
              <span>You have {unreadCount} unread system alert{unreadCount !== 1 ? 's' : ''}</span>
            ) : (
              'You are all caught up!'
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <AnimatedButton
            onClick={handleMarkAllAsRead}
            variant="secondary"
            className="text-xs uppercase tracking-wider py-2.5 px-4 font-bold flex items-center gap-2"
          >
            <FaCheckDouble className="text-[10px]" /> Mark All Read
          </AnimatedButton>
        )}
      </motion.div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/5 scrollbar-thin">
        {[
          { value: 'all', label: 'All Notifications' },
          { value: 'unread', label: 'Unread' },
          { value: 'read', label: 'Read' }
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border
              ${filter === tab.value
                ? 'bg-primary-500/10 text-primary-400 border-primary-500/25 shadow-sm'
                : 'bg-dark-900/40 text-gray-400 border-transparent hover:text-white'
              }`}
          >
            {tab.label}
            {tab.value === 'unread' && unreadCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-primary-500 text-white text-[9px] font-black rounded-full leading-none">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      {loading ? (
        <div className="text-center py-16 space-y-4">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">Loading alerts...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <GlassCard hoverable={false} className="text-center py-16 space-y-6 border-white/5 bg-dark-900/40">
          <FaBell className="text-gray-600 text-5xl mx-auto opacity-35" />
          <div>
            <h3 className="text-xl font-bold text-white font-display">No Notifications</h3>
            <p className="text-gray-400 text-sm mt-1">
              {filter === 'all' 
                ? "You don't have any notifications yet." 
                : `No ${filter} notifications found.`
              }
            </p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification, idx) => (
            <motion.div
              key={notification._id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
              onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
            >
              <GlassCard 
                hoverable={!notification.isRead}
                className={`p-5 bg-dark-900/50 border border-white/5 transition-all
                  ${!notification.isRead 
                    ? 'border-primary-500/25 bg-primary-500/5 shadow-md shadow-primary-500/5' 
                    : ''
                  }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-10 h-10 bg-dark-950/80 border border-white/5 rounded-xl flex items-center justify-center flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <h4 className="text-white font-bold text-sm leading-tight">{notification.title}</h4>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5 shadow-sm shadow-primary-500/50"></span>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs font-medium leading-relaxed mb-2">{notification.message}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500 font-bold">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(notification._id)
                        }}
                        className="text-red-400 hover:text-red-300 text-xs p-1 cursor-pointer"
                      >
                        <FaTrash />
                      </button>
                    </div>

                    {/* Notification attachments */}
                    {notification.data?.rideId && (
                      <Link
                        to={`/ride/${notification.data.rideId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3.5"
                      >
                        <AnimatedButton variant="secondary" className="py-1.5 px-3 text-[10px] uppercase font-black tracking-wider">
                          View Ride Details
                        </AnimatedButton>
                      </Link>
                    )}
                    {notification.data?.bookingId && (
                      <div className="flex flex-col gap-2">
                        {notification.type === 'shared_ride_passenger_approval_required' && (
                          <div className="mt-3 flex gap-3" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => handlePassengerApprove(e, notification.data.bookingId, notification._id)}
                              className="bg-primary-500 text-black hover:bg-primary-400 py-1.5 px-4 rounded-xl text-xs font-bold cursor-pointer"
                            >
                              Accept & Share
                            </button>
                            <button
                              onClick={(e) => handlePassengerDeny(e, notification.data.bookingId, notification._id)}
                              className="btn-secondary border border-red-500/20 text-red-400 hover:bg-red-500/10 py-1.5 px-4 rounded-xl text-xs font-bold cursor-pointer"
                            >
                              Deny
                            </button>
                          </div>
                        )}

                        {notification.type === 'shared_ride_driver_approval_required' && (
                          <div className="mt-3 flex gap-3" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => handleDriverApprove(e, notification.data.bookingId, notification._id)}
                              className="bg-primary-500 text-black hover:bg-primary-400 py-1.5 px-4 rounded-xl text-xs font-bold cursor-pointer"
                            >
                              Accept
                            </button>
                            <button
                              onClick={(e) => handleDriverDecline(e, notification.data.bookingId, notification._id)}
                              className="btn-secondary border border-red-500/20 text-red-400 hover:bg-red-500/10 py-1.5 px-4 rounded-xl text-xs font-bold cursor-pointer"
                            >
                              Decline
                            </button>
                          </div>
                        )}

                        {notification.type !== 'shared_ride_passenger_approval_required' && 
                         notification.type !== 'shared_ride_driver_approval_required' && (
                          <Link
                            to={user?.role === 'driver' ? `/driver/rides` : `/bookings`}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-3.5"
                          >
                            <AnimatedButton variant="secondary" className="py-1.5 px-3 text-[10px] uppercase font-black tracking-wider">
                              View Reservations
                            </AnimatedButton>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Notifications
