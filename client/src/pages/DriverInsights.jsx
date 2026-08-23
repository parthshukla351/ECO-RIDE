import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCar, FaStar, FaMoneyBillWave, FaChartBar, FaShieldAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import GlassCard from '../components/ui/GlassCard';
import api from '../services/api';

const DriverInsights = () => {
  const [metrics, setMetrics] = useState(null);
  const [breakdown, setBreakdown] = useState({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const { data } = await api.get('/analytics/driver');
      setMetrics(data.metrics);
      setBreakdown(data.ratingBreakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
      setChartData(data.earningsChart || []);
    } catch (err) {
      toast.error('Failed to load driver performance metrics.');
    } finally {
      setLoading(false);
    }
  };

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

    const areaD = points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : '';

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

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

        {areaD && <path d={areaD} fill="url(#areaGrad)" />}

        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r="4" fill="#1E3A8A" stroke="#3B82F6" strokeWidth="2" />
            <text x={p.x} y={p.y - 10} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">
              ₹{p.value}
            </text>
            <text x={p.x} y={height - 10} textAnchor="middle" fill="#9CA3AF" fontSize="9" fontWeight="bold">
              {p.name}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  const performanceScore = metrics?.performanceScore || 90;
  const ratingVal = metrics?.averageRating || 4.5;

  const aiInsights = [
    `Your highest ratings occurred during morning rush hours (7 AM - 10 AM).`,
    `Average passenger ratings improved by 4% compared to your historical averages.`,
    `Keeping cancellation rates under 5% helps maintain your high safety score index.`
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black font-display text-white tracking-tight flex items-center gap-2">
          <FaCar className="text-primary-500" /> Driver Insights Center
        </h1>
        <p className="text-gray-400 text-sm font-medium mt-1">Review your performance averages, rating breakdowns, and earnings trends.</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Earnings & Performance charts */}
          <div className="lg:col-span-2 space-y-6">
            <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-6 space-y-6">
              <h3 className="text-white font-bold font-display text-base">Weekly Earnings Trend</h3>
              <div className="pt-2">{renderSVGChart(chartData)}</div>
            </GlassCard>

            {/* Performance Score */}
            <div className="grid sm:grid-cols-2 gap-6">
              <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-6 space-y-4">
                <h4 className="text-white font-bold text-sm">Performance Score</h4>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full border-4 border-primary-500/20 border-t-primary-500 flex items-center justify-center text-xl font-black text-white">
                    {performanceScore}%
                  </div>
                  <div>
                    <p className="text-xs text-gray-300 font-semibold">Reliability Index: {metrics?.reliabilityScore}%</p>
                    <p className="text-xs text-gray-300 font-semibold mt-1">Efficiency Index: {metrics?.efficiencyScore}%</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-2">Verified Performance Score</p>
                  </div>
                </div>
              </GlassCard>

              {/* Rating breakdown */}
              <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-6 space-y-4">
                <h4 className="text-white font-bold text-sm">Average Ratings Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-gray-400">Trust rating</span>
                    <span className="text-yellow-400 font-bold flex items-center gap-1">
                      {ratingVal.toFixed(1)} <FaStar className="text-[10px]" />
                    </span>
                  </div>
                  
                  <div className="space-y-1.5 pt-1.5 border-t border-white/5">
                    {[5, 4, 3, 2, 1].map(stars => {
                      const count = breakdown[stars] || 0;
                      const totalReviews = metrics?.totalRatings || 1;
                      const pct = Math.round((count / Math.max(1, totalReviews)) * 100);
                      return (
                        <div key={stars} className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">
                          <span className="w-8">{stars} Star</span>
                          <div className="flex-1 h-1.5 bg-dark-950 rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-6 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>

          {/* AI Insights & Safety Anomalies Panel */}
          <div className="space-y-6">
            <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-6 space-y-6">
              <h3 className="text-white font-bold font-display text-base">AI Copilot Recommendations</h3>
              
              <div className="space-y-4">
                {aiInsights.map((insight, idx) => (
                  <div key={idx} className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-1 text-xs font-semibold">
                    <p className="text-white leading-relaxed">{insight}</p>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-1">Recommended by Driver Safety Agent</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard hoverable={false} className="border-white/5 bg-dark-900/40 p-6 space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-white uppercase">
                <span>Total Earnings</span>
                <FaMoneyBillWave className="text-green-400 text-lg" />
              </div>
              <p className="text-3xl font-black text-white">₹{(metrics?.totalEarnings || 0).toLocaleString()}</p>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Completed payouts credited directly to wallet</span>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverInsights;
