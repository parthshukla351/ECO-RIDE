import { FaMapMarkerAlt, FaExclamationTriangle } from 'react-icons/fa'
import GlassCard from '../ui/GlassCard'
import AnimatedButton from '../ui/AnimatedButton'

const LocationPermissionPrompt = ({ permissionState, requestLocation, onManualSelect }) => {
  if (permissionState === 'granted') return null

  return (
    <GlassCard hoverable={false} className="border-yellow-500/20 bg-yellow-500/5 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <FaExclamationTriangle className="text-yellow-500 text-sm" />
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="text-yellow-400 font-black text-xs uppercase tracking-wider">
            {permissionState === 'denied' ? 'Location Access Blocked' : 'Enable Location Services'}
          </h4>
          <p className="text-gray-400 text-[11px] leading-relaxed">
            {permissionState === 'denied'
              ? 'Location access is required to provide accurate pickup, route, and ETA information. You can allow location access in your browser settings, or enter locations manually below.'
              : 'Allowing location access lets us automatically find your pickup point and calculate the optimal routes.'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {permissionState !== 'denied' && (
          <AnimatedButton
            type="button"
            variant="primary"
            onClick={requestLocation}
            className="py-2 px-4 text-[10px] uppercase font-black tracking-wider"
          >
            <FaMapMarkerAlt className="text-[9px]" /> Enable My Location
          </AnimatedButton>
        )}
        
        <AnimatedButton
          type="button"
          variant="secondary"
          onClick={onManualSelect}
          className="py-2 px-4 text-[10px] uppercase font-black tracking-wider"
        >
          Select Location Manually
        </AnimatedButton>
      </div>
    </GlassCard>
  )
}

export default LocationPermissionPrompt
