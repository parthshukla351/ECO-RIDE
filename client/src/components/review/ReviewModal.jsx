import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaTimes, FaStar, FaCheckCircle, FaLeaf } from 'react-icons/fa'
import api from '../../services/api'
import toast from 'react-hot-toast'

const ReviewModal = ({ isOpen, onClose, booking, onSuccess }) => {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const availableTags = [
    { id: 'punctual', label: '⏰ Punctual', emoji: '⏰' },
    { id: 'friendly', label: '😊 Friendly', emoji: '😊' },
    { id: 'safe_driver', label: '🛡️ Safe Driver', emoji: '🛡️' },
    { id: 'clean_car', label: '✨ Clean Car', emoji: '✨' },
    { id: 'good_route', label: '🗺️ Good Route', emoji: '🗺️' },
    { id: 'music_lover', label: '🎵 Music Lover', emoji: '🎵' },
    { id: 'quiet', label: '🤫 Quiet Ride', emoji: '🤫' },
    { id: 'eco_conscious', label: '🌱 Eco-Conscious', emoji: '🌱' },
    { id: 'helpful', label: '🤝 Helpful', emoji: '🤝' },
    { id: 'professional', label: '👔 Professional', emoji: '👔' }
  ]

  const ratingLabels = {
    1: 'Poor',
    2: 'Below Average',
    3: 'Average',
    4: 'Good',
    5: 'Excellent'
  }

  const toggleTag = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    setLoading(true)
    try {
      await api.post('/reviews', {
        bookingId: booking._id,
        rating,
        comment: comment.trim(),
        tags: selectedTags
      })

      setSubmitted(true)
      toast.success('Review submitted! Thank you! ⭐')
      
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 2500)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg glass-dark p-6 z-10 max-h-[90vh] overflow-y-auto"
        >
          {submitted ? (
            /* Success State */
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
              >
                <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FaStar className="text-yellow-400 text-4xl" />
                </div>
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-2">Thank You! ⭐</h3>
              <p className="text-gray-400 mb-4">Your review helps the EcoRide community</p>
              
              <div className="flex justify-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <FaStar
                    key={star}
                    className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-600'}`}
                  />
                ))}
              </div>

              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-green-400 text-sm">
                  <FaLeaf />
                  <span>+50 eco points earned for your review!</span>
                </div>
              </div>
            </div>
          ) : (
            /* Review Form */
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Rate Your Ride</h2>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Ride Info */}
              <div className="p-4 bg-gray-800/50 rounded-xl mb-6">
                <div className="flex items-center gap-3">
                  <img
                    src={booking?.driver?.avatar || 'https://via.placeholder.com/40'}
                    alt={booking?.driver?.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-primary-500"
                  />
                  <div>
                    <p className="text-white font-semibold">{booking?.driver?.name}</p>
                    <p className="text-gray-400 text-sm">
                      {booking?.ride?.origin?.city} → {booking?.ride?.destination?.city}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {booking?.ride?.departureTime && new Date(booking.ride.departureTime).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Star Rating */}
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-300 mb-3">How was your experience?</p>
                  <div className="flex justify-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <FaStar
                          className={`text-4xl transition-colors ${
                            star <= (hoverRating || rating)
                              ? 'text-yellow-400'
                              : 'text-gray-600 hover:text-gray-500'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {(hoverRating || rating) > 0 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-primary-400 font-semibold"
                    >
                      {ratingLabels[hoverRating || rating]}
                    </motion.p>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <p className="text-sm font-medium text-gray-300 mb-3">What stood out? (optional)</p>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map(tag => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`px-3 py-2 rounded-full text-sm transition-all ${
                          selectedTags.includes(tag.id)
                            ? 'bg-primary-500/20 text-primary-400 border-2 border-primary-500/50'
                            : 'bg-gray-800 text-gray-400 border-2 border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <p className="text-sm font-medium text-gray-300 mb-2">Write a review (optional)</p>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with other riders..."
                    rows={4}
                    maxLength={500}
                    className="input-field resize-none"
                  />
                  <p className="text-xs text-gray-500 text-right mt-1">
                    {comment.length}/500
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || rating === 0}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle /> Submit Review
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default ReviewModal