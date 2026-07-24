import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa'

const StarRating = ({ rating = 0, size = 'md', showValue = true, totalReviews = null }) => {
  const sizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
    xl: 'text-2xl'
  }

  const renderStars = () => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        stars.push(<FaStar key={i} className={`text-yellow-400 ${sizes[size]}`} />)
      } else if (i - 0.5 <= rating) {
        stars.push(<FaStarHalfAlt key={i} className={`text-yellow-400 ${sizes[size]}`} />)
      } else {
        stars.push(<FaRegStar key={i} className={`text-gray-600 ${sizes[size]}`} />)
      }
    }
    return stars
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {renderStars()}
      </div>
      {showValue && (
        <span className="text-white font-semibold text-sm">
          {rating.toFixed(1)}
        </span>
      )}
      {totalReviews !== null && (
        <span className="text-gray-500 text-xs">
          ({totalReviews})
        </span>
      )}
    </div>
  )
}

export default StarRating