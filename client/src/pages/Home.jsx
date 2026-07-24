import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { FaMapMarkerAlt, FaCalendarAlt, FaCar, FaClock, FaBox, FaMotorcycle } from 'react-icons/fa'

const Home = () => {
  const navigate = useNavigate()
  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/search?origin=${pickup}&destination=${dropoff}`)
  }

  return (
    <div className="min-h-screen bg-white">
      
      {/* --- HERO SECTION (Like SC 28) --- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side: Ride Request Box */}
          <div className="max-w-md">
            <h1 className="text-5xl lg:text-6xl font-bold text-black mb-8 tracking-tight">
              Request a ride
            </h1>

            <form onSubmit={handleSearch} className="space-y-4 relative">
              {/* Vertical line connecting inputs */}
              <div className="absolute left-[23px] top-[30px] bottom-[30px] w-[2px] bg-gray-300 z-0"></div>

              <div className="relative z-10">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full"></div>
                <input 
                  type="text" 
                  placeholder="Pickup location" 
                  className="input-clean pl-12"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  required
                />
              </div>

              <div className="relative z-10">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-black rounded-sm"></div>
                <input 
                  type="text" 
                  placeholder="Dropoff location" 
                  className="input-clean pl-12"
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-black w-full mt-4 text-lg">
                See prices
              </button>
            </form>
          </div>

          {/* Right Side: Hero Image */}
          <div className="hidden lg:block">
            <img 
              src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2070&auto=format&fit=crop" 
              alt="City Ride" 
              className="w-full h-[500px] object-cover rounded-2xl shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* --- BANNER --- */}
      <div className="bg-gray-100 py-6 my-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-black font-medium">
            🌱 <span className="underline">EcoRide AI Promise:</span> Every ride booked through our platform offsets carbon emissions. 
          </p>
        </div>
      </div>

      {/* --- FEATURES GRID (Like SC 29) --- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-black mb-8">
          Explore what you can do with EcoRide
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="card-clean bg-gray-50 flex flex-col justify-between group cursor-pointer border-none">
            <div>
              <h3 className="text-xl font-bold text-black mb-2">Ride</h3>
              <p className="text-gray-600 text-sm mb-6">
                Go anywhere with AI-matched rides. Request a ride, hop in, and go green.
              </p>
            </div>
            <div className="flex justify-between items-end">
              <Link to="/search" className="bg-white text-black px-4 py-2 rounded-full font-medium text-sm shadow-sm group-hover:bg-gray-100 transition-colors">
                Details
              </Link>
              <FaCar className="text-6xl text-gray-800" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="card-clean bg-gray-50 flex flex-col justify-between group cursor-pointer border-none">
            <div>
              <h3 className="text-xl font-bold text-black mb-2">Reserve</h3>
              <p className="text-gray-600 text-sm mb-6">
                Reserve your ride in advance so you can relax on the day of your trip.
              </p>
            </div>
            <div className="flex justify-between items-end">
              <button className="bg-white text-black px-4 py-2 rounded-full font-medium text-sm shadow-sm group-hover:bg-gray-100 transition-colors">
                Details
              </button>
              <FaCalendarAlt className="text-6xl text-gray-800" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="card-clean bg-gray-50 flex flex-col justify-between group cursor-pointer border-none">
            <div>
              <h3 className="text-xl font-bold text-black mb-2">Intercity</h3>
              <p className="text-gray-600 text-sm mb-6">
                Get convenient, affordable outstation rides anytime at your door.
              </p>
            </div>
            <div className="flex justify-between items-end">
              <button className="bg-white text-black px-4 py-2 rounded-full font-medium text-sm shadow-sm group-hover:bg-gray-100 transition-colors">
                Details
              </button>
              <FaMapMarkerAlt className="text-6xl text-gray-800" />
            </div>
          </div>

        </div>
      </section>

    </div>
  )
}

export default Home