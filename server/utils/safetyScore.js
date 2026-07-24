/**
 * Calculate AI Safety Score for a user
 * Score range: 0-100
 */
const calculateSafetyScore = (userData) => {
  let score = 100;
  const reasons = [];

  // Rating penalty (if below 3.5)
  if (userData.averageRating < 3.5 && userData.totalRatings > 5) {
    const penalty = (3.5 - userData.averageRating) * 10;
    score -= penalty;
    reasons.push(`Low rating (${userData.averageRating}): -${penalty.toFixed(1)}`);
  }

  // Cancellation penalty
  const cancellationRate = userData.totalRides > 0 
    ? (userData.cancellationCount / userData.totalRides) * 100 
    : 0;
  
  if (cancellationRate > 30) {
    const penalty = Math.min(30, (cancellationRate - 30) * 0.5);
    score -= penalty;
    reasons.push(`High cancellation rate (${cancellationRate.toFixed(1)}%): -${penalty.toFixed(1)}`);
  }

  // Completed rides bonus
  if (userData.completedRides >= 50) score = Math.min(100, score + 5);
  if (userData.completedRides >= 100) score = Math.min(100, score + 5);

  // Verified account bonus
  if (userData.isVerified) score = Math.min(100, score + 5);

  // License verified bonus (driver)
  if (userData.driverLicense?.verified) score = Math.min(100, score + 5);

  // New user (no history)
  if (userData.totalRides === 0) {
    score = 75; // Default for new users
    reasons.push('New user - building trust score');
  }

  return {
    score: Math.max(0, Math.round(score)),
    level: getSafetyLevel(score),
    reasons,
    breakdown: {
      baseScore: 100,
      ratingFactor: userData.averageRating,
      cancellationRate: cancellationRate.toFixed(1) + '%',
      completedRides: userData.completedRides,
      isVerified: userData.isVerified
    }
  };
};

const getSafetyLevel = (score) => {
  if (score >= 90) return { label: 'Excellent', color: 'green', icon: '🛡️' };
  if (score >= 75) return { label: 'Good', color: 'blue', icon: '✅' };
  if (score >= 60) return { label: 'Average', color: 'yellow', icon: '⚠️' };
  if (score >= 40) return { label: 'Poor', color: 'orange', icon: '⚠️' };
  return { label: 'Risky', color: 'red', icon: '🚨' };
};

module.exports = { calculateSafetyScore };
