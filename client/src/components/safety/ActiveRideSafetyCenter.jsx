import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShieldAlt, FaPhone, FaShareAlt, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import GlassCard from '../ui/GlassCard';
import AnimatedButton from '../ui/AnimatedButton';
import safetyService from '../../services/safetyService';

const ActiveRideSafetyCenter = ({ rideId, bookingId, isOpen, onClose }) => {
  const [contacts, setContacts] = useState([]);
  const [sosActive, setSosActive] = useState(false);
  const [activeIncident, setActiveIncident] = useState(null);
  const [sharingActive, setSharingActive] = useState(false);
  const [shareToken, setShareToken] = useState('');
  
  // Slide to activate slider states
  const [sliderPosition, setSliderPosition] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchContacts();
    }
  }, [isOpen]);

  const fetchContacts = async () => {
    try {
      const data = await safetyService.getContacts();
      setContacts(data.contacts || []);
    } catch (error) {
      console.warn('Failed to load contacts for safety center');
    }
  };

  const handleShareTrip = async () => {
    try {
      const data = await safetyService.createShareSession(rideId);
      setShareToken(data.token);
      setSharingActive(true);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(data.shareUrl);
      toast.success('Secure live tracking link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to generate tracking session');
    }
  };

  const handleRevokeShare = async () => {
    if (!shareToken) return;
    try {
      await safetyService.revokeShareSession(shareToken);
      setSharingActive(false);
      setShareToken('');
      toast.success('Location sharing terminated');
    } catch (error) {
      toast.error('Failed to revoke tracking session');
    }
  };

  // Trigger SOS when slider hits the end of track
  const handleDragEnd = async (event, info) => {
    if (info.offset.x >= 140) {
      // Trigger SOS
      try {
        // Grab browser location coordinates
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            const data = await safetyService.triggerSOS({
              rideId,
              bookingId,
              lat: latitude,
              lng: longitude,
              accuracy
            });
            setActiveIncident(data.incident);
            setSosActive(true);
            toast.error('🚨 Emergency SOS alert activated!', { duration: 5000 });
          },
          async (err) => {
            // Fallback with rough default coordinates (civil lines, prayagraj center)
            const data = await safetyService.triggerSOS({
              rideId,
              bookingId,
              lat: 25.45,
              lng: 81.85,
              accuracy: 1000
            });
            setActiveIncident(data.incident);
            setSosActive(true);
            toast.error('🚨 Emergency SOS activated (default position)!', { duration: 5000 });
          }
        );
      } catch (error) {
        toast.error('Failed to activate emergency SOS');
      }
    }
    setSliderPosition(0); // reset position
  };

  const handleResolveSOS = async () => {
    if (!activeIncident) return;
    try {
      await safetyService.resolveSOS(activeIncident._id, { status: 'CANCELLED', notes: 'Passenger marked safe' });
      setSosActive(false);
      setActiveIncident(null);
      toast.success('SOS incident cancelled successfully.');
    } catch (error) {
      toast.error('Failed to cancel SOS incident');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm">
          {/* Modal Panel */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="w-full max-w-md"
          >
            <GlassCard hoverable={false} className="border-white/5 bg-dark-900/90 p-6 space-y-6 relative overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex justify-between items-center pb-2">
                <div className="flex items-center gap-2">
                  <FaShieldAlt className={`${sosActive ? 'text-red-500 animate-pulse' : 'text-primary-400'} text-base`} />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    {sosActive ? '🚨 SOS Emergency Active' : '🛡️ Safety Center'}
                  </h3>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-all cursor-pointer">
                  <FaTimes />
                </button>
              </div>

              {sosActive ? (
                // EMERGENCY SOS ACTIVE SCREEN
                <div className="space-y-5 text-center py-2">
                  <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto text-2xl animate-pulse">
                    <FaExclamationTriangle />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-base">Emergency Contacts Notified</h4>
                    <p className="text-gray-400 text-xs mt-1">Your active trip location and safety metrics have been shared with your trusted contacts.</p>
                  </div>

                  <div className="space-y-3 pt-3">
                    <a href="tel:112" className="block w-full">
                      <AnimatedButton variant="primary" className="w-full py-3 bg-red-600 hover:bg-red-700 text-xs font-bold uppercase tracking-wider text-white">
                        📞 Dial Emergency Services (112)
                      </AnimatedButton>
                    </a>

                    <AnimatedButton onClick={handleResolveSOS} variant="secondary" className="w-full py-2.5 text-xs font-bold uppercase tracking-wider">
                      I am Safe / Cancel SOS
                    </AnimatedButton>
                  </div>
                </div>
              ) : (
                // STANDARD SAFETY CONTROLS
                <div className="space-y-6">
                  {/* Slider SOS Action */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Emergency SOS</label>
                    <div className="relative h-12 bg-red-950/20 border border-red-500/20 rounded-xl flex items-center justify-center overflow-hidden">
                      <span className="text-red-400/50 text-[10px] uppercase font-black tracking-widest select-none pointer-events-none">
                        Slide right to SOS
                      </span>
                      
                      <motion.div
                        drag="x"
                        dragConstraints={{ left: 0, right: 150 }}
                        dragElastic={0}
                        onDragEnd={handleDragEnd}
                        style={{ x: sliderPosition }}
                        className="absolute left-1 top-1 w-10 h-10 bg-red-600 hover:bg-red-500 border border-red-500/20 rounded-lg flex items-center justify-center text-white cursor-grab active:cursor-grabbing shadow-lg"
                      >
                        <FaShieldAlt className="text-sm" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Share Live Location */}
                  <div className="space-y-2 border-t border-white/5 pt-4">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Location Intelligence</label>
                    
                    {sharingActive ? (
                      <div className="flex gap-2 items-center justify-between bg-green-500/10 border border-green-500/20 p-3.5 rounded-xl">
                        <div>
                          <p className="text-white text-xs font-bold">Trip Sharing Active</p>
                          <p className="text-gray-400 text-[9px] uppercase font-semibold mt-0.5">Secure link generated</p>
                        </div>
                        <AnimatedButton onClick={handleRevokeShare} variant="secondary" className="py-1.5 px-3 text-[10px] uppercase font-bold text-red-400 border-red-500/20 bg-red-500/5">
                          Stop Share
                        </AnimatedButton>
                      </div>
                    ) : (
                      <AnimatedButton onClick={handleShareTrip} variant="secondary" className="w-full py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                        <FaShareAlt className="text-[10px]" /> Share Live Tracking Link
                      </AnimatedButton>
                    )}
                  </div>

                  {/* Emergency Contacts Dial List */}
                  <div className="space-y-3 border-t border-white/5 pt-4">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Trusted Safety Contacts</label>
                    
                    {contacts.length === 0 ? (
                      <p className="text-xs text-gray-500 font-medium">No contacts configured. Set them in safety settings.</p>
                    ) : (
                      <div className="space-y-2 max-h-36 overflow-y-auto">
                        {contacts.map((contact) => (
                          <div key={contact._id} className="flex justify-between items-center bg-white/5 border border-white/5 p-3 rounded-xl">
                            <div>
                              <p className="text-white text-xs font-bold flex items-center gap-1.5">
                                {contact.name}
                                {contact.isPrimary && <span className="text-[8px] text-primary-400 uppercase font-black">Primary</span>}
                              </p>
                              <p className="text-gray-400 text-[10px] mt-0.5">{contact.relationship} • {contact.phone}</p>
                            </div>
                            <a href={`tel:${contact.phone}`}>
                              <button className="p-2 bg-primary-500/10 border border-primary-500/20 text-primary-400 rounded-xl hover:bg-primary-500/20 transition-all cursor-pointer text-xs">
                                <FaPhone />
                              </button>
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ActiveRideSafetyCenter;
