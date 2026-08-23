const axios = require('axios');

// Local database of coordinates for reliable testing/dev geocoding without consuming credits
const LOCAL_GEOCODE_DB = {
  'prayagraj': { lat: 25.4372, lng: 81.8463 },
  'allahabad': { lat: 25.4372, lng: 81.8463 },
  'lucknow': { lat: 26.8467, lng: 80.9462 },
  'lalgopalganj': { lat: 25.7533, lng: 81.6367 },
  'kunda': { lat: 25.7208, lng: 81.5167 },
  'delhi': { lat: 28.6139, lng: 77.2090 },
  'jaipur': { lat: 26.9124, lng: 75.7873 },
  'kanpur': { lat: 26.4499, lng: 80.3319 },
  'unnao': { lat: 26.5393, lng: 80.4878 },
  'gurugram': { lat: 28.4595, lng: 77.0266 },
  'noida': { lat: 28.5355, lng: 77.3910 }
};

// Haversine formula to compute straight-line distance in km
const haversineDistance = (coords1, coords2) => {
  if (!coords1 || !coords2 || !coords1.lat || !coords1.lng || !coords2.lat || !coords2.lng) {
    return null;
  }
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(coords2.lat - coords1.lat);
  const dLng = toRad(coords2.lng - coords1.lng);
  
  const lat1 = toRad(coords1.lat);
  const lat2 = toRad(coords2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// Decode Google Encoded Polyline into list of coordinates
const decodePolyline = (str) => {
  if (!str) return [];
  let index = 0, len = str.length;
  let lat = 0, lng = 0;
  const coordinates = [];

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    coordinates.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return coordinates;
};

// Geocode a text search query
const geocodeAddress = async (address) => {
  if (!address) return null;
  const clean = address.trim().toLowerCase();
  
  // 1. Check local coordinates DB (substring matching for city names with suffixes like ', India')
  const foundKey = Object.keys(LOCAL_GEOCODE_DB).find(key => clean.includes(key));
  if (foundKey) {
    return LOCAL_GEOCODE_DB[foundKey];
  }

  // 2. Call Google Geocoding API if key is set
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (apiKey && apiKey !== 'your_google_maps_key') {
    try {
      const { data } = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
      );
      if (data.results && data.results[0]) {
        const loc = data.results[0].geometry.location;
        return { lat: loc.lat, lng: loc.lng };
      }
    } catch (err) {
      console.warn('Geocoding service call failed, falling back to dummy coordinates');
    }
  }

  // 3. Fallback: generate deterministic coordinates
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const lat = 25.0 + (Math.abs(hash % 300) / 100);
  const lng = 75.0 + (Math.abs((hash >> 3) % 500) / 100);
  return { lat, lng };
};

// Find the closest coordinate point along the route
const getClosestPointOnRoute = (point, routeCoords) => {
  if (!routeCoords || routeCoords.length === 0) {
    return { closestPoint: point, distance: 999, index: 0 };
  }

  let minDistance = Infinity;
  let closestIndex = 0;
  let closestPoint = routeCoords[0];

  for (let i = 0; i < routeCoords.length - 1; i++) {
    const p1 = routeCoords[i];
    const p2 = routeCoords[i + 1];

    let t = 0;
    const dx = p2.lng - p1.lng;
    const dy = p2.lat - p1.lat;

    if (dx !== 0 || dy !== 0) {
      t = ((point.lng - p1.lng) * dx + (point.lat - p1.lat) * dy) / (dx * dx + dy * dy);
      t = Math.max(0, Math.min(1, t)); // clamp to segment
    }

    const c = {
      lat: p1.lat + t * dy,
      lng: p1.lng + t * dx
    };

    const dist = haversineDistance(point, c);
    if (dist < minDistance) {
      minDistance = dist;
      closestIndex = i;
      closestPoint = c;
    }
  }

  return {
    closestPoint,
    distance: minDistance,
    index: closestIndex,
    progressPercent: Math.round((closestIndex / routeCoords.length) * 100)
  };
};

// Extract intermediate stops along the route using reverse geocoding or local helper rules
const extractIntermediatePlaces = async (originCity, destCity, routeCoords) => {
  const oClean = originCity.trim().toLowerCase();
  const dClean = destCity.trim().toLowerCase();

  // Route-specific seeding list for premium simulation
  if ((oClean === 'prayagraj' || oClean === 'allahabad') && dClean === 'lucknow') {
    return [
      { name: 'Lalgopalganj', lat: 25.7533, lng: 81.6367, progress: 25 },
      { name: 'Kunda', lat: 25.7208, lng: 81.5167, progress: 50 },
      { name: 'Unchahar', lat: 25.9083, lng: 81.3167, progress: 75 }
    ];
  }

  if (oClean === 'delhi' && dClean === 'jaipur') {
    return [
      { name: 'Gurugram', lat: 28.4595, lng: 77.0266, progress: 15 },
      { name: 'Manesar', lat: 28.3516, lng: 76.9428, progress: 30 },
      { name: 'Neemrana', lat: 27.9944, lng: 76.3886, progress: 55 },
      { name: 'Shahpura', lat: 27.3833, lng: 75.9667, progress: 80 }
    ];
  }

  if (oClean === 'lucknow' && dClean === 'kanpur') {
    return [
      { name: 'Bani', lat: 26.6853, lng: 80.7589, progress: 35 },
      { name: 'Unnao', lat: 26.5393, lng: 80.4878, progress: 70 }
    ];
  }

  // Generic dynamic coordinate interpolation extraction
  const places = [];
  if (routeCoords.length >= 10) {
    const fractions = [0.25, 0.5, 0.75];
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    for (let f of fractions) {
      const idx = Math.floor(routeCoords.length * f);
      const coord = routeCoords[idx];
      let name = `Waypoint-${Math.round(f * 100)}`;

      if (apiKey && apiKey !== 'your_google_maps_key') {
        try {
          const { data } = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coord.lat},${coord.lng}&key=${apiKey}`
          );
          if (data.results && data.results[0]) {
            const comps = data.results[0].address_components;
            const locality = comps.find(c => c.types.includes('locality') || c.types.includes('administrative_area_level_2'));
            if (locality) name = locality.long_name;
          }
        } catch (err) {}
      }

      places.push({
        name,
        lat: coord.lat,
        lng: coord.lng,
        progress: Math.round(f * 100)
      });
    }
  }

  return places;
};

// Calculate match score
const calculateMatchScore = (ride, searchParams) => {
  let points = 0;
  const reasons = [];

  const originLat = parseFloat(searchParams.originLat);
  const originLng = parseFloat(searchParams.originLng);
  const destLat = parseFloat(searchParams.destinationLat);
  const destLng = parseFloat(searchParams.destinationLng);

  const rideOrigin = ride.origin?.coordinates;
  const rideDest = ride.destination?.coordinates;

  // 1. Proximity matching using route coordinates list if available
  if (originLat && originLng && destLat && destLng && ride.routeCoordinates?.length > 0) {
    const pLoc = { lat: originLat, lng: originLng };
    const dLoc = { lat: destLat, lng: destLng };

    const pickupProj = getClosestPointOnRoute(pLoc, ride.routeCoordinates);
    const dropoffProj = getClosestPointOnRoute(dLoc, ride.routeCoordinates);

    // Direction check
    if (pickupProj.index < dropoffProj.index) {
      points += 40;
      reasons.push('Pickup and dropoff match route direction');

      const pickupDist = pickupProj.distance;
      const dropoffDist = dropoffProj.distance;

      if (pickupDist <= 1.0) points += 20;
      else if (pickupDist <= 3.0) points += 10;

      if (dropoffDist <= 1.0) points += 20;
      else if (dropoffDist <= 3.0) points += 10;
    } else {
      points = 10; // penalty for wrong direction
    }
  } else {
    // Exact text matching fallback
    const originMatch = searchParams.origin && ride.origin?.city?.toLowerCase() === searchParams.origin.trim().toLowerCase();
    const destMatch = searchParams.destination && ride.destination?.city?.toLowerCase() === searchParams.destination.trim().toLowerCase();

    if (originMatch && destMatch) {
      points += 70;
      reasons.push('Exact city origin/destination match');
    } else if (originMatch || destMatch) {
      points += 30;
      reasons.push('Partial route match');
    }
  }

  // 2. Time Compatibility
  if (ride.departureTime) {
    const rideDate = new Date(ride.departureTime);
    const searchDate = searchParams.date ? new Date(searchParams.date) : new Date();
    const timeDiffHrs = Math.abs(rideDate.getTime() - searchDate.getTime()) / (1000 * 60 * 60);

    if (timeDiffHrs <= 1.5) {
      points += 20;
      reasons.push('Leaves within preferred departure window');
    } else if (timeDiffHrs <= 4.0) {
      points += 10;
    }
  }

  // 3. Driver score rating bonus
  if (ride.driver?.averageRating >= 4.6) {
    points += 10;
    reasons.push('Highly rated driver');
  }

  return {
    score: Math.max(10, Math.min(100, points)),
    reasons: reasons.slice(0, 3)
  };
};

const getRouteDetails = async (originCoords, destCoords) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  // 1. Try Google Directions API first if key is present
  if (apiKey && apiKey !== 'your_google_maps_key' && apiKey.trim() !== '') {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originCoords.lat},${originCoords.lng}&destination=${destCoords.lat},${destCoords.lng}&key=${apiKey}`;
      const { data } = await axios.get(url);
      if (data.status === 'OK' && data.routes && data.routes[0]) {
        const route = data.routes[0];
        const leg = route.legs[0];
        return {
          distance: parseFloat((leg.distance.value / 1000).toFixed(1)), // km
          duration: Math.round(leg.duration.value / 60), // minutes
          polyline: route.overview_polyline.points,
          coordinates: decodePolyline(route.overview_polyline.points)
        };
      }
    } catch (err) {
      console.warn('Google Directions API failed, trying OSRM fallback:', err.message);
    }
  }

  // 2. Try OSRM routing API fallback
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}?overview=full&geometries=polyline`;
    const { data } = await axios.get(url);
    if (data.routes && data.routes[0]) {
      const route = data.routes[0];
      return {
        distance: parseFloat((route.distance / 1000).toFixed(1)), // km
        duration: Math.round(route.duration / 60), // minutes
        polyline: route.geometry,
        coordinates: decodePolyline(route.geometry)
      };
    }
  } catch (err) {
    console.warn('OSRM routing failed:', err.message);
  }

  // 3. Last fallback: straight-line Haversine route
  const dist = haversineDistance(originCoords, destCoords);
  const drivingDist = parseFloat((dist * 1.25).toFixed(1)); // 25% detour multiplier for roads
  const duration = Math.round((drivingDist / 50) * 60); // 50 km/h avg speed
  
  // Create simple 2-point coordinates list
  const coordinates = [originCoords, destCoords];
  
  // Custom simple polyline encoder
  const encodeVal = (val) => {
    val = val < 0 ? ~(val << 1) : val << 1;
    let resStr = '';
    while (val >= 0x20) {
      resStr += String.fromCharCode((0x20 | (val & 0x1f)) + 63);
      val >>= 5;
    }
    resStr += String.fromCharCode(val + 63);
    return resStr;
  };
  let polyline = '';
  let prevLat = 0, prevLng = 0;
  for (let coord of coordinates) {
    const lat = Math.round(coord.lat * 1e5);
    const lng = Math.round(coord.lng * 1e5);
    polyline += encodeVal(lat - prevLat) + encodeVal(lng - prevLng);
    prevLat = lat;
    prevLng = lng;
  }

  return {
    distance: drivingDist,
    duration,
    polyline,
    coordinates
  };
};

module.exports = {
  haversineDistance,
  decodePolyline,
  geocodeAddress,
  getClosestPointOnRoute,
  extractIntermediatePlaces,
  calculateMatchScore,
  getRouteDetails
};
