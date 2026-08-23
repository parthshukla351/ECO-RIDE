import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaShieldAlt, FaCar, FaClock, FaMapMarkerAlt, FaUsers, FaLeaf } from 'react-icons/fa';
import GlassCard from '../components/ui/GlassCard';
import MapView from '../components/map/MapView';
import safetyService from '../services/safetyService';

const ShareTracking = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rideData, setRideData] = useState(null);

  useEffect(() => {
    fetchTrackingData();
    
    // Set up a 10-second polling interval for real-time location telemetry
    const interval = setInterval(() => {
      fetchTrackingData(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [token]);

  const fetchTrackingData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const data = await safetyService.getShareSessionDetails(token);
      setRideData(data.ride);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'This secure tracking link is invalid or expired.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Loading secure trip tracking...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto text-2xl">
          <FaShieldAlt />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white font-display">Tracking Link Inactive</h3>
          <p className="text-gray-400 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  const { origin, destination, driver, status, currentLocation, departureTime } = rideData;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl flex items-center justify-center text-base animate-pulse">
          ●
        </div>
        <div>
          <h1 className="text-2xl font-black font-display text-white tracking-tight">
            Live Trip Tracking 🛡️
          </h1>
          <p className="text-gray-400 text-xs font-semibold">Secure, real-time passenger transit details</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Route Details and Driver Stats */}
        <div className="lg:col-span-1 space-y-6">
          {/* Trip Status */}
          <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-5 space-y-4">
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Trip Status</span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-full border
                  ${status === 'in_progress' 
                    ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                    : status === 'completed'
                      ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                      : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {status?.replace('_', ' ')}
                </span>
                <span className="text-white font-bold text-xs">
                  {status === 'in_progress' ? '🚗 En route' : '📅 Scheduled'}
                </span>
              </div>
            </div>

            <div className="space-y-3 border-t border-white/5 pt-4">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-gray-500">Pickup</span>
                <p className="text-white font-bold text-sm mt-0.5">{origin?.address || origin?.city}</p>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider text-gray-500">Destination</span>
                <p className="text-white font-bold text-sm mt-0.5">{destination?.address || destination?.city}</p>
              </div>
            </div>
          </GlassCard>

          {/* Driver Card */}
          <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-5 space-y-4">
            <div className="flex items-center gap-4">
              <img
                src={driver?.avatar || 'https://res.cloudinary.com/demo/image/upload/v1/default-avatar.png'}
                alt={driver?.name}
                className="w-12 h-12 rounded-full object-cover border border-white/10"
              />
              <div>
                <h4 className="text-white font-bold text-sm flex items-center gap-1.5">
                  {driver?.name}
                  <span className="px-1.5 py-0.5 bg-primary-500/10 border border-primary-500/20 text-primary-400 text-[8px] font-black uppercase rounded-full">
                    ✓ Verified
                  </span>
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5 font-semibold">
                  <span className="text-yellow-400">★ {driver?.rating?.toFixed(1) || '0.0'}</span>
                  <span>•</span>
                  <span>{driver?.completedRides || 0} trips</span>
                </div>
              </div>
            </div>

            {/* Vehicle info */}
            {driver?.vehicle && (
              <div className="border-t border-white/5 pt-3.5 space-y-2">
                <span className="text-[9px] uppercase tracking-wider text-gray-500">Vehicle Credentials</span>
                <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
                  <span>{driver.vehicle.color} {driver.vehicle.make} {driver.vehicle.model}</span>
                  <span className="bg-white/5 border border-white/5 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider text-white">
                    {driver.vehicle.licensePlate}
                  </span>
                </div>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Map View Column */}
        <div className="lg:col-span-2">
          <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 overflow-hidden h-[500px]">
            <MapView
              origin={origin}
              destination={destination}
              currentLocation={currentLocation}
              isTrackingView={true}
            />
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default ShareTracking;
