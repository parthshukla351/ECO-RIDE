const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Ride = require('../models/Ride');
const { geocodeAddress, getRouteDetails } = require('../services/rideMatchingService');

dotenv.config();

const fixRides = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecoride_ai');
    console.log('✅ MongoDB Connected for fixing rides...');

    const rides = await Ride.find({});
    console.log(`Found ${rides.length} rides. Scanning for coordinate mismatches...`);

    let updatedCount = 0;

    for (let ride of rides) {
      const originCity = ride.origin?.city?.toLowerCase() || '';
      const destCity = ride.destination?.city?.toLowerCase() || '';
      const originLat = ride.origin?.coordinates?.lat || 0;
      const destLat = ride.destination?.coordinates?.lat || 0;

      // Check if coordinates are in the Delhi latitude block (27.5 to 29.5) but cities are Lucknow/Prayagraj
      const isOriginMismatched = (originCity.includes('lucknow') || originCity.includes('prayagraj') || originCity.includes('allahabad')) && (originLat > 27.5 && originLat < 29.5);
      const isDestMismatched = (destCity.includes('lucknow') || destCity.includes('prayagraj') || destCity.includes('allahabad')) && (destLat > 27.5 && destLat < 29.5);
      const isRouteEmpty = !ride.routeCoordinates || ride.routeCoordinates.length === 0;

      if (isOriginMismatched || isDestMismatched || isRouteEmpty) {
        console.log(`\n♻️ Fixing ride ${ride._id} (${ride.origin.city} -> ${ride.destination.city})`);
        
        // Geocode origin
        const geoOrigin = await geocodeAddress(ride.origin.address || ride.origin.city);
        if (geoOrigin) {
          ride.origin.coordinates = geoOrigin;
          console.log(`  Origin coordinates updated to:`, geoOrigin);
        }

        // Geocode destination
        const geoDest = await geocodeAddress(ride.destination.address || ride.destination.city);
        if (geoDest) {
          ride.destination.coordinates = geoDest;
          console.log(`  Destination coordinates updated to:`, geoDest);
        }

        // Recalculate OSRM/Google road polyline
        if (ride.origin.coordinates && ride.destination.coordinates) {
          const routeData = await getRouteDetails(ride.origin.coordinates, ride.destination.coordinates);
          ride.distance = routeData.distance;
          ride.duration = routeData.duration;
          ride.routePolyline = routeData.polyline;
          ride.routeCoordinates = routeData.coordinates;
          console.log(`  Route recalculated: ${routeData.distance} km, ${routeData.duration} mins`);
        }

        await ride.save();
        updatedCount++;
      }
    }

    console.log(`\n🎯 Successfully updated ${updatedCount} rides with correct coordinates and routes!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error fixing rides:', err);
    process.exit(1);
  }
};

fixRides();
