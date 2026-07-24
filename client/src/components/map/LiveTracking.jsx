import { useState, useEffect } from 'react'
import { useSocket } from '../../context/SocketContext'
import MapView from './MapView'
import { FaCircle, FaCar, FaClock } from 'react-icons/fa'

const LiveTracking = ({ ride }) => {
  const { socket } = useSocket()
  const [driverLocation, setDriverLocation] = useState(null)
  const [eta, setEta] = useState(null)
  const [isTracking, setIsTracking] = useState(false)

  useEffect(() => {
    if (!socket || !ride?._id) return

    socket.emit('joinRide', ride._id)
    setIsTracking(true)

    socket.on('driverLocationUpdate', ({ location, timestamp }) => {
      setDriverLocation(location)
      calculateETA(location)
    })

    socket.on('rideStarted', () => {
      setIsTracking(true)
    })

    socket.on('rideEnded', () => {
      setIsTracking(false)
    })

    // Set initial location if available
    if (ride.currentLocation?.lat) {
      setDriverLocation({
        lat: ride.currentLocation.lat,
        lng: ride.currentLocation.lng
      })
    }

    return () => {
      socket.emit('leaveRide', ride._id)
      socket.off('driverLocationUpdate')
      socket.off('rideStarted')
      socket.off('rideEnded')
    }
  }, [socket, ride?._id])

  const calculateETA = (location) => {
    if (!ride?.destination?.coordinates || !location) return
    
    const R = 6371
    const dLat = (ride.destination.coordinates.lat - location.lat) * Math.PI / 180
    const dLng = (ride.destination.coordinates.lng - location.lng) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(location.lat * Math.PI / 180) * Math.cos(ride.destination.coordinates.lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c
    
    const avgSpeed = 60
    const etaMinutes = Math.round((distance / avgSpeed) * 60)
    setEta(etaMinutes)
  }

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      <div className={`p-4 rounded-xl flex items-center justify-between ${
        isTracking && ride?.status === 'in_progress'
          ? 'bg-green-500/10 border border-green-500/30'
          : 'bg-gray-800 border border-gray-700'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
          }`}></div>
          <div>
            <p className="text-white font-semibold">
              {isTracking && ride?.status === 'in_progress' ? 'Live Tracking Active' : 'Tracking Not Started'}
            </p>
            {driverLocation && (
              <p className="text-gray-400 text-xs">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {eta && (
          <div className="text-right">
            <div className="flex items-center gap-2 text-primary-400">
              <FaClock className="text-sm" />
              <span className="font-bold text-lg">{eta} min</span>
            </div>
            <p className="text-gray-500 text-xs">ETA to destination</p>
          </div>
        )}
      </div>

      {/* Map */}
      <MapView
        origin={ride?.origin}
        destination={ride?.destination}
        currentLocation={driverLocation}
        height="350px"
        showRoute={true}
        interactive={true}
      />

      {/* Driver Info */}
      {driverLocation && (
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <p className="text-gray-400 text-xs mb-1">Latitude</p>
            <p className="text-white text-sm font-mono">{driverLocation.lat?.toFixed(4)}</p>
          </div>
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <p className="text-gray-400 text-xs mb-1">Longitude</p>
            <p className="text-white text-sm font-mono">{driverLocation.lng?.toFixed(4)}</p>
          </div>
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <p className="text-gray-400 text-xs mb-1">Status</p>
            <p className="text-green-400 text-sm font-semibold flex items-center justify-center gap-1">
              <FaCar /> In Transit
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default LiveTracking