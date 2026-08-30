import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaMapMarkerAlt, FaCalendarAlt, FaCar, FaClock, FaTree, FaRoute, FaArrowRight, FaBolt, FaShieldAlt } from 'react-icons/fa'
import GlassCard from '../components/ui/GlassCard'
import AnimatedButton from '../components/ui/AnimatedButton'

const Home = () => {
  const navigate = useNavigate()
  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/search?origin=${pickup}&destination=${dropoff}`)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  }

  return (
    <div className="min-h-screen bg-dark-950 bg-hero pb-20 relative">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-[10%] right-[10%] w-[350px] h-[350px] bg-primary-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[5%] w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Header Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-12 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mx-auto space-y-6"
        >
          <span className="text-xs font-black uppercase tracking-widest text-primary-400 bg-primary-500/10 px-4 py-1.5 rounded-full border border-primary-500/25 inline-flex items-center gap-1.5 shadow-sm">
            <FaBolt className="text-[10px] animate-pulse" /> Intelligent shared mobility
          </span>
          <h1 className="text-5xl md:text-7xl font-black font-display text-white tracking-tight leading-none">
            share your<span className="text-gradient">ride save</span> your money
          </h1>
          <p className="text-gray-400 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            Connect with verified drivers. Match coordinates, optimize routes, and reduce emissions on an AI-powered shared transit ecosystem.
          </p>
        </motion.div>
      </section>

      {/* Hero Form Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          {/* Left Form */}
          <div className="lg:col-span-5 max-w-md w-full mx-auto lg:mx-0">
            <GlassCard 
              hoverable={false}
              className="p-8 border-white/15 bg-dark-900/60 shadow-2xl glow-green"
            >
              <h2 className="text-2xl font-black font-display text-white mb-6 tracking-tight">
                Request a ride
              </h2>

              <form onSubmit={handleSearch} className="space-y-5 relative">
                {/* Visual Connection Pin Line */}
                <div className="absolute left-[19px] top-[26px] bottom-[72px] w-[1px] bg-gradient-to-b from-primary-500 to-cyan-400 opacity-30 z-0"></div>

                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-primary-500 rounded-full flex-shrink-0 relative">
                    <span className="absolute -inset-1 rounded-full bg-primary-500/30 animate-ping"></span>
                  </div>
                  <div className="w-full">
                    <input 
                      type="text" 
                      placeholder="Enter pickup city (e.g. Delhi)" 
                      className="input-field pl-4 py-3.5 bg-dark-950/80 text-sm font-medium"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full flex-shrink-0 relative">
                    <span className="absolute -inset-1 rounded-full bg-cyan-400/30 animate-ping"></span>
                  </div>
                  <div className="w-full">
                    <input 
                      type="text" 
                      placeholder="Enter destination city (e.g. Mumbai)" 
                      className="input-field pl-4 py-3.5 bg-dark-950/80 text-sm font-medium"
                      value={dropoff}
                      onChange={(e) => setDropoff(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <AnimatedButton 
                  type="submit" 
                  variant="primary" 
                  fullWidth 
                  className="py-4 mt-6 text-sm font-bold uppercase tracking-wider"
                >
                  Find Available Rides <FaArrowRight />
                </AnimatedButton>
              </form>
            </GlassCard>
          </div>

          {/* Right Banner Card */}
          <div className="lg:col-span-7 hidden lg:block">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative rounded-3xl overflow-hidden border border-white/5 shadow-2xl h-[420px]"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/10 to-transparent z-10" />
              <img 
                src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2070&auto=format&fit=crop" 
                alt="City Navigation View" 
                className="w-full h-full object-cover filter brightness-[0.7] contrast-[1.05]"
              />
              
              {/* Overlaid Eco metric card */}
              <div className="absolute bottom-6 left-6 z-20">
                <GlassCard 
                  hoverable={false}
                  className="p-5 border-white/10 max-w-xs bg-dark-950/85 backdrop-blur-md"
                >
                  <p className="text-primary-400 font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                    <FaTree /> Zero Emission
                  </p>
                  <p className="text-xs text-gray-400 leading-relaxed font-medium">
                    Our dynamic shared routing cuts carbon footprint by up to 40% per journey, matching riders in real-time.
                  </p>
                </GlassCard>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Dynamic Trust Banner */}
      <section className="max-w-7xl mx-auto px-4 mt-8 relative z-10">
        <GlassCard 
          hoverable={false}
          className="border-white/5 bg-white/2 py-5 px-8 text-center"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm">
            <span className="flex items-center gap-1 text-primary-400 font-bold">
              🌱 EcoRide Mission
            </span>
            <span className="text-gray-400 font-medium">
              We leverage routing technology to replace single-occupant cars with shared carbon-optimized transit.
            </span>
          </div>
        </GlassCard>
      </section>

      {/* Feature Cards Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <h3 className="text-3xl font-black font-display text-white mb-10 tracking-tight text-center sm:text-left">
          Travel Smarter, Greener,Begin Your Zero Carbon Commute
        </h3>

        <motion.div 
          className="grid md:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Card 1 */}
          <GlassCard 
            delay={0.1}
            className="flex flex-col justify-between group cursor-pointer border-white/5 bg-dark-900/40 p-8"
          >
            <div>
              <div className="w-12 h-12 bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-xl flex items-center justify-center text-xl mb-6 group-hover:bg-primary-500/20 transition-all shadow-inner">
                <FaCar />
              </div>
              <h4 className="text-xl font-bold text-white mb-3 font-display">Instant Pool</h4>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed font-medium">
                Connect instantly with verified drivers heading your way. Lower your expenses while cutting traffic emissions.
              </p>
            </div>
            <Link to="/search" className="text-xs text-primary-400 font-black flex items-center gap-1 group-hover:gap-2 transition-all uppercase tracking-wider">
              Find Rides <FaArrowRight />
            </Link>
          </GlassCard>

          {/* Card 2 */}
          <GlassCard 
            delay={0.2}
            className="flex flex-col justify-between group cursor-pointer border-white/5 bg-dark-900/40 p-8"
          >
            <div>
              <div className="w-12 h-12 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl flex items-center justify-center text-xl mb-6 group-hover:bg-cyan-500/20 transition-all shadow-inner">
                <FaCalendarAlt />
              </div>
              <h4 className="text-xl font-bold text-white mb-3 font-display">Scheduled Commute</h4>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed font-medium">
                Schedule your commute up to a week in advance. Clean scheduling for regular office timings or weekend travels.
              </p>
            </div>
            <Link to="/search" className="text-xs text-cyan-400 font-black flex items-center gap-1 group-hover:gap-2 transition-all uppercase tracking-wider">
              Book Advance <FaArrowRight />
            </Link>
          </GlassCard>

          {/* Card 3 */}
          <GlassCard 
            delay={0.3}
            className="flex flex-col justify-between group cursor-pointer border-white/5 bg-dark-900/40 p-8"
          >
            <div>
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center justify-center text-xl mb-6 group-hover:bg-emerald-500/20 transition-all shadow-inner">
                <FaRoute />
              </div>
              <h4 className="text-xl font-bold text-white mb-3 font-display">Intercity Transit</h4>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed font-medium">
                Affordable, comfortable long-distance travel. Share interstate journeys with green drivers to maximize carbon offset points.
              </p>
            </div>
            <Link to="/search" className="text-xs text-primary-400 font-black flex items-center gap-1 group-hover:gap-2 transition-all uppercase tracking-wider">
              Explore Intercity <FaArrowRight />
            </Link>
          </GlassCard>
        </motion.div>
      </section>
    </div>
  )
}

export default Home
