import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FaCar, FaCheckCircle, FaLock, FaUsers } from 'react-icons/fa'
import { useSocket } from '../../contexts/SocketContext'
import api from '../../services/api'
import toast from 'react-hot-toast'

const SeatSelection = ({ rideId, seatsToBook, onSeatsSelected }) => {
  const { socket } = useSocket()
  const [seats, setSeats] = useState([])
  const [selectedSeats, setSelectedSeats] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchSeats = useCallback(async () => {
    try {
      const { data } = await api.get(`/rides/${rideId}/seats`)
      setSeats(data.seats)
    } catch (err) {
      console.error('Failed to load seats:', err)
    } finally {
      setLoading(false)
    }
  }, [rideId])

  useEffect(() => {
    fetchSeats()
  }, [fetchSeats])

  // Connect to Socket.IO for real-time seat lock/release events
  useEffect(() => {
    if (!socket || !rideId) return

    socket.emit('joinRide', rideId)

    const handleSeatsLocked = () => {
      fetchSeats()
    }
    const handleSeatsReleased = () => {
      fetchSeats()
    }
    const handleSeatsOccupied = () => {
      fetchSeats()
    }

    socket.on('seatsLocked', handleSeatsLocked)
    socket.on('seatsReleased', handleSeatsReleased)
    socket.on('seatsOccupied', handleSeatsOccupied)

    return () => {
      socket.emit('leaveRide', rideId)
      socket.off('seatsLocked', handleSeatsLocked)
      socket.off('seatsReleased', handleSeatsReleased)
      socket.off('seatsOccupied', handleSeatsOccupied)
    }
  }, [socket, rideId, fetchSeats])

  // Handle seat click
  const handleSeatClick = async (seat) => {
    if (seat.status === 'OCCUPIED') {
      toast.error(`Seat ${seat.seatNumber} is already occupied.`)
      return
    }

    if (seat.status === 'LOCKED' && !seat.lockInfo?.isOwnLock) {
      toast.error(`Seat ${seat.seatNumber} is temporarily locked by another user.`)
      return
    }

    // Toggle logic
    let newSelection = [...selectedSeats]
    if (newSelection.includes(seat.seatNumber)) {
      // Remove selection
      newSelection = newSelection.filter(s => s !== seat.seatNumber)
      setSelectedSeats(newSelection)
      onSeatsSelected(newSelection)
      
      // Release backend lock
      try {
        await api.post(`/rides/${rideId}/seats/release`, { seats: [seat.seatNumber] })
      } catch (err) {
        console.warn('Failed to release lock:', err)
      }
    } else {
      // Add selection, enforce selection limit
      if (newSelection.length >= seatsToBook) {
        // Remove oldest selection and release its lock
        const oldest = newSelection.shift()
        try {
          await api.post(`/rides/${rideId}/seats/release`, { seats: [oldest] })
        } catch (err) {}
      }
      
      newSelection.push(seat.seatNumber)
      
      // Try to acquire backend lock
      try {
        await api.post(`/rides/${rideId}/seats/lock`, { seats: [seat.seatNumber] })
        setSelectedSeats(newSelection)
        onSeatsSelected(newSelection)
      } catch (err) {
        toast.error(err.response?.data?.message || `Failed to lock seat ${seat.seatNumber}`)
        fetchSeats() // Refresh layout
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Helper to split seats into row pairs for premium visual car layout representation
  const renderSeatLayout = () => {
    return (
      <div className="border border-white/5 bg-dark-950/60 p-6 rounded-2xl max-w-[260px] mx-auto space-y-4 shadow-inner relative overflow-hidden">
        {/* Dashboard wheel header */}
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <div className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
            <FaCar /> Front Row
          </div>
          <div className="w-7 h-7 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-xs" title="Steering Wheel">
            ☸️
          </div>
        </div>

        {/* Dynamic rows */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-2">
          {seats.map((seat) => {
            const isOwnSelected = selectedSeats.includes(seat.seatNumber)
            const isLocked = seat.status === 'LOCKED' && !seat.lockInfo?.isOwnLock
            const isOccupied = seat.status === 'OCCUPIED'

            let bgClass = 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
            let statusLabel = 'Available'
            if (isOwnSelected) {
              bgClass = 'bg-primary-500/25 border-primary-500 text-primary-400 shadow-md shadow-primary-500/10'
              statusLabel = 'Selected'
            } else if (isOccupied) {
              bgClass = 'bg-red-500/15 border-red-500/25 text-red-500/60 cursor-not-allowed opacity-50'
              statusLabel = 'Occupied'
            } else if (isLocked) {
              bgClass = 'bg-yellow-500/15 border-yellow-500/25 text-yellow-500/60 cursor-not-allowed opacity-60'
              statusLabel = 'Locked'
            }

            return (
              <motion.button
                key={seat.seatNumber}
                type="button"
                whileTap={!(isOccupied || isLocked) ? { scale: 0.95 } : {}}
                onClick={() => handleSeatClick(seat)}
                className={`py-3.5 px-4 rounded-xl border text-xs font-black transition-all flex flex-col items-center justify-center gap-1 outline-none ${bgClass}`}
                aria-label={`Seat ${seat.seatNumber}, ${statusLabel}`}
                disabled={isOccupied || isLocked}
              >
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Seat</span>
                <span className="text-base">{seat.seatNumber}</span>
                {isOccupied && <span className="text-[8px] uppercase tracking-wider">Booked</span>}
                {isLocked && <span className="text-[8px] uppercase tracking-wider flex items-center gap-0.5"><FaLock className="text-[6px]" /> Locked</span>}
              </motion.button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 pb-2">
        <span className="flex items-center gap-1.5"><FaUsers /> Passenger Seats Map</span>
        <span className="text-primary-400">Select exactly {seatsToBook} seat(s)</span>
      </div>

      {renderSeatLayout()}

      {/* Seat Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest pt-2">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-white/5 border border-white/10"></span>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-500/20 border border-primary-500"></span>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/30"></span>
          <span>Locked</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/30"></span>
          <span>Occupied</span>
        </div>
      </div>
    </div>
  )
}

export default SeatSelection
