import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaLeaf, FaCar, FaMapMarkerAlt, FaCloudSun, FaPlusCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import GlassCard from '../components/ui/GlassCard';
import AnimatedButton from '../components/ui/AnimatedButton';
import api from '../services/api';

const CarbonDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [targetGoal, setTargetGoal] = useState(50); // default 50kg target

  // Simulated carbon savings by month for beautiful SVG line chart rendering
  const [chartData, setChartData] = useState([
    { name: 'Jan', value: 4.2 },
    { name: 'Feb', value: 6.8 },
    { name: 'Mar', value: 8.4 },
    { name: 'Apr', value: 11.2 },
    { name: 'May', value: 9.6 },
    { name: 'Jun', value: 14.8 }
  ]);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const { data } = await api.get('/analytics/summary');
      setSummary(data.summary);
      if (data.summary?.co2Saved > 0) {
        // Adjust the final month's value dynamically based on actual database calculations!
        setChartData(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { name: 'Jun', value: parseFloat(data.summary.co2Saved.toFixed(1)) };
          return updated;
        });
      }
    } catch (err) {
      toast.error('Failed to load carbon metrics');
    } finally {
      setLoading(false);
    }
  };

  // Reusable responsive SVG line chart builder
  const renderSVGChart = (data) => {
    const width = 500;
    const height = 200;
    const padding = 30;

    const values = data.map(d => d.value);
    const maxValue = Math.max(1, ...values);

    // Compute coordinate points
    const points = data.map((d, index) => {
      const x = padding + (index * (width - padding * 2) / (data.length - 1));
      const y = height - padding - (d.value * (height - padding * 2) / maxValue);
      return { x, y, name: d.name, value: d.value };
    });

    const pathD = points.reduce((acc, p, index) => {
      return index === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    // Area path for gradient fill under the line chart
    const areaD = points.length > 0 
      ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : '';

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {/* Horizontal grid lines */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = padding + ratio * (height - padding * 2);
          return (
            <line
              key={idx}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="white"
              strokeOpacity="0.05"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Gradient fill area */}
        {areaD && <path d={areaD} fill="url(#areaGrad)" />}

        {/* Core Line Path */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="#10B981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Circle Anchors and Labels */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r="4" fill="#065F46" stroke="#10B981" strokeWidth="2" />
            {/* Tooltip hover stats */}
            <text x={p.x} y={p.y - 10} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">
              {p.value}kg
            </text>
            {/* Axis labels */}
            <text x={p.x} y={height - 10} textAnchor="middle" fill="#9CA3AF" fontSize="9" fontWeight="bold">
              {p.name}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  const co2Saved = summary?.co2Saved || 0;
  const treesEquivalent = parseFloat((co2Saved / 22.0).toFixed(2)); // 1 mature tree absorbs ~22kg CO2 per year
  const goalProgressPercent = Math.min(100, Math.round((co2Saved / targetGoal) * 100));

  return (
    <div className="space-y-8 pb-12">
      {/* Title */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black font-display text-white tracking-tight flex items-center gap-2">
          <FaLeaf className="text-green-400" /> Carbon Analytics Dashboard
        </h1>
        <p className="text-gray-400 text-sm font-medium mt-1">Review verified carpool offset statistics and environmental goals.</p>
      </motion.div>

      {/* Grid Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard hoverable={false} className="p-6 border-white/5 bg-dark-900/40 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Estimated CO₂ Saved</span>
            <FaCloudSun className="text-green-400 text-lg" />
          </div>
          <p className="text-2xl font-black text-white">{co2Saved.toFixed(1)} kg</p>
          <span className="text-[10px] text-gray-500 font-bold uppercase">Estimated offsets avoided</span>
        </GlassCard>

        <GlassCard hoverable={false} className="p-6 border-white/5 bg-dark-900/40 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Carpool Distance</span>
            <FaMapMarkerAlt className="text-blue-400 text-lg" />
          </div>
          <p className="text-2xl font-black text-white">{summary?.distanceShared || 0} km</p>
          <span className="text-[10px] text-gray-500 font-bold uppercase">Shared travel distance</span>
        </GlassCard>

        <GlassCard hoverable={false} className="p-6 border-white/5 bg-dark-900/40 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Completed Carpools</span>
            <FaCar className="text-yellow-400 text-lg" />
          </div>
          <p className="text-2xl font-black text-white">{summary?.completedRides || 0}</p>
          <span className="text-[10px] text-gray-500 font-bold uppercase">Eco-friendly trips</span>
        </GlassCard>

        <GlassCard hoverable={false} className="p-6 border-white/5 bg-dark-900/40 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Tree Absorption</span>
            <FaLeaf className="text-emerald-400 text-lg" />
          </div>
          <p className="text-2xl font-black text-white">{treesEquivalent} yrs</p>
          <span className="text-[10px] text-gray-500 font-bold uppercase">Equivalent tree annual absorptions</span>
        </GlassCard>
      </div>

      {/* Main Graph & Target Goals */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* SVG Area Chart */}
        <div className="lg:col-span-2">
          <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-6 space-y-6">
            <h3 className="text-white font-bold font-display text-base">Carbon Savings Trend (kg CO₂)</h3>
            {loading ? (
              <div className="text-center py-20">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              <div className="pt-2">{renderSVGChart(chartData)}</div>
            )}
          </GlassCard>
        </div>

        {/* Goals Progress Widgets */}
        <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-6 space-y-6">
          <h3 className="text-white font-bold font-display text-base">Personal Carbon Goals</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold uppercase text-gray-400 mb-1">
                <span>Goal Target</span>
                <span className="text-white">{targetGoal} kg CO₂</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="5"
                value={targetGoal}
                onChange={(e) => setTargetGoal(parseInt(e.target.value))}
                className="w-full accent-green-500 cursor-pointer bg-dark-950 rounded-lg h-2"
              />
            </div>

            <div className="pt-4 border-t border-white/5 space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-gray-400">Current Progress</span>
                <span className="text-green-400 font-bold">{goalProgressPercent}%</span>
              </div>
              
              <div className="h-3 bg-dark-950 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all duration-500" 
                  style={{ width: `${goalProgressPercent}%` }} 
                />
              </div>
              
              <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed mt-1">
                {co2Saved >= targetGoal 
                  ? '🎉 Outstanding! You have reached your environmental carbon savings goal!'
                  : `You are ${(targetGoal - co2Saved).toFixed(1)} kg CO₂ away from reaching your target. Keep ridesharing!`
                }
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default CarbonDashboard;
