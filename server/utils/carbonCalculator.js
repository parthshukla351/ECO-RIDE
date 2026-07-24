// Emission factors in kg CO2 per km per vehicle
const EMISSION_FACTORS = {
  petrol: 0.21,
  diesel: 0.25,
  hybrid: 0.11,
  electric: 0.05,
  bus: 0.089,
  train: 0.041
};

// Average single car emission factor
const AVERAGE_CAR_EMISSION = 0.21;

/**
 * Calculate carbon emission for a ride
 * @param {number} distanceKm - Distance in kilometers
 * @param {string} vehicleType - Type of vehicle
 * @param {number} passengers - Number of passengers
 * @returns {object} Carbon data
 */
const calculateCarbonEmission = (distanceKm, vehicleType = 'petrol', passengers = 1) => {
  const emissionFactor = EMISSION_FACTORS[vehicleType] || EMISSION_FACTORS.petrol;
  
  // Total emission for the vehicle
  const totalEmission = distanceKm * emissionFactor;
  
  // Emission per passenger (shared)
  const emissionPerPassenger = totalEmission / (passengers + 1); // +1 for driver
  
  // Carbon saved compared to individual car travel
  const individualCarEmission = distanceKm * AVERAGE_CAR_EMISSION;
  const carbonSaved = individualCarEmission - emissionPerPassenger;
  
  // Trees equivalent (one tree absorbs ~21 kg CO2 per year)
  const treesEquivalent = carbonSaved / 21;
  
  // Eco points earned (10 points per kg CO2 saved)
  const ecoPoints = Math.round(Math.max(0, carbonSaved) * 10);
  
  return {
    totalEmission: Math.round(totalEmission * 1000) / 1000,      // kg
    emissionPerPassenger: Math.round(emissionPerPassenger * 1000) / 1000, // kg
    carbonSaved: Math.round(Math.max(0, carbonSaved) * 1000) / 1000,    // kg
    treesEquivalent: Math.round(treesEquivalent * 100) / 100,
    ecoPoints,
    distanceKm,
    vehicleType,
    passengers
  };
};

/**
 * Calculate monthly carbon stats for user
 */
const calculateMonthlyCarbonStats = (rides) => {
  return rides.reduce((acc, ride) => {
    acc.totalCO2Saved += ride.carbonSaved || 0;
    acc.totalDistance += ride.distance || 0;
    acc.totalRides += 1;
    acc.totalEcoPoints += ride.ecoPointsEarned || 0;
    return acc;
  }, {
    totalCO2Saved: 0,
    totalDistance: 0,
    totalRides: 0,
    totalEcoPoints: 0
  });
};

module.exports = { 
  calculateCarbonEmission, 
  calculateMonthlyCarbonStats,
  EMISSION_FACTORS 
};