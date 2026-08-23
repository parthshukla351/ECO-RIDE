import { FaCheckCircle, FaExclamationCircle, FaHourglassHalf } from 'react-icons/fa'

const VerificationBadge = ({ status = 'verified', size = 'sm' }) => {
  const getBadgeDetails = (type) => {
    switch (type) {
      case 'verified':
      case 'true':
      case true:
        return {
          label: 'Verified',
          icon: FaCheckCircle,
          classes: 'bg-green-500/10 text-green-400 border-green-500/20'
        }
      case 'pending':
      case 'review':
        return {
          label: 'Pending Review',
          icon: FaHourglassHalf,
          classes: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
        }
      default:
        return {
          label: 'Unverified',
          icon: FaExclamationCircle,
          classes: 'bg-red-500/10 text-red-400 border-red-500/20'
        }
    }
  }

  const badge = getBadgeDetails(status)
  const Icon = badge.icon

  return (
    <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1 leading-none ${badge.classes} ${
      size === 'lg' ? 'px-3.5 py-1 text-[10px]' : ''
    }`}>
      <Icon className="text-[10px]" />
      <span>{badge.label}</span>
    </span>
  )
}

export default VerificationBadge
