import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGift, FaWallet, FaLeaf, FaTicketAlt, FaCheckCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import GlassCard from '../components/ui/GlassCard';
import AnimatedButton from '../components/ui/AnimatedButton';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const RewardStore = () => {
  const { user, updateUser } = useAuth();
  const [balance, setBalance] = useState(user?.ecoPoints || 100);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  const availableRewards = [
    {
      id: 'DISCOUNT_50',
      name: '₹50 Ride Discount Voucher',
      cost: 500,
      description: 'Get ₹50 flat discount off your next ride. Valid for 30 days.'
    },
    {
      id: 'DISCOUNT_100',
      name: '₹100 Ride Discount Voucher',
      cost: 900,
      description: 'Get ₹100 flat discount off your next ride. Valid for 30 days.'
    },
    {
      id: 'PREMIUM_PERK',
      name: 'Premium Profile Badge',
      cost: 300,
      description: 'Unlock the exclusive "Eco Companion" badge next to your profile photo.'
    }
  ];

  useEffect(() => {
    fetchMyRewards();
  }, []);

  const fetchMyRewards = async () => {
    try {
      const { data } = await api.get('/analytics/rewards/my-rewards');
      setRewards(data.rewards || []);
    } catch (err) {
      toast.error('Failed to load transaction logs');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (reward) => {
    if (balance < reward.cost) {
      toast.error('Insufficient Eco Points balance.');
      return;
    }

    const confirm = window.confirm(`Confirm redemption of ${reward.name} for ${reward.cost} Eco Points?`);
    if (!confirm) return;

    setRedeeming(true);
    try {
      const { data } = await api.post('/analytics/rewards/redeem', { rewardId: reward.id });
      toast.success(data.message);
      
      // Update balance & user contexts
      setBalance(data.ecoPoints);
      updateUser({ ...user, ecoPoints: data.ecoPoints, ecoLevel: data.ecoLevel });
      fetchMyRewards();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to redeem reward.');
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black font-display text-white tracking-tight flex items-center gap-2">
            <FaGift className="text-primary-500" /> Eco Rewards Store
          </h1>
          <p className="text-gray-400 text-sm font-medium mt-1">Exchange your earned sustainable points for ride discounts and partner perks.</p>
        </div>

        <GlassCard hoverable={false} className="p-4 border-white/5 bg-dark-900/40 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500/10 border border-primary-500/20 text-primary-400 rounded-xl flex items-center justify-center text-lg">
            <FaLeaf />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Your Balance</p>
            <p className="text-lg font-black text-white">{balance} Eco Points</p>
          </div>
        </GlassCard>
      </div>

      {/* Rewards Catalog */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">🎁 Available Rewards Catalog</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {availableRewards.map((reward) => (
            <GlassCard key={reward.id} hoverable={false} className="border-white/5 bg-dark-900/40 p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="text-white font-bold text-sm leading-snug">{reward.name}</h4>
                  <span className="text-[10px] font-black uppercase text-primary-400 px-2 py-0.5 bg-primary-500/10 border border-primary-500/20 rounded-md">
                    {reward.cost} pts
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-medium leading-relaxed">{reward.description}</p>
              </div>

              <AnimatedButton
                onClick={() => handleRedeem(reward)}
                disabled={redeeming || balance < reward.cost}
                variant={balance < reward.cost ? 'secondary' : 'primary'}
                className="w-full py-2.5 text-xs font-bold uppercase tracking-wider"
              >
                {balance < reward.cost ? 'Locked' : 'Claim Reward'}
              </AnimatedButton>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Redeemed Ledger */}
      <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-6 space-y-4">
        <h3 className="text-white font-bold font-display text-lg">Redeemed Coupons Ledger</h3>
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : rewards.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-xs font-semibold">
            No coupons claimed yet. Accumulate Eco Points to claim discounts!
          </div>
        ) : (
          <div className="space-y-3">
            {rewards.map((red) => (
              <div key={red._id} className="p-4 bg-white/5 border border-white/5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FaTicketAlt className="text-primary-400" />
                    <span className="text-white font-bold">{red.rewardName}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Redeemed on {new Date(red.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-dark-950/60 border border-white/5 px-3 py-1.5 rounded-lg">
                    <code className="text-green-400 font-mono font-black select-all">{red.couponCode}</code>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">
                    {red.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default RewardStore;
