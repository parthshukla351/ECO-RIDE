const Agent = require('../models/Agent');

/**
 * Computes carpool passenger offset savings and eco scores.
 * @param {Object} params - distance, sharingCount
 */
const analyzeCarbon = async ({ distance = 10, sharingCount = 2 }) => {
  const startTime = Date.now();
  const agent = await Agent.findOne({ agentId: 'carbon-analytics' });

  if (!agent || !agent.enabled) {
    return { status: 'disabled', message: 'Carbon Analytics Agent is inactive.' };
  }

  // Formula: Distance * 0.18 kg CO2/km * factor
  const emissionsAvoided = parseFloat((distance * 0.18 * (sharingCount - 1 || 1)).toFixed(2));
  const efficiencyScore = Math.min(100, Math.round(75 + (sharingCount * 5)));

  const latency = Date.now() - startTime;

  agent.stats.executionCount += 1;
  agent.stats.successCount += 1;
  agent.stats.avgLatency = Math.round((agent.stats.avgLatency * (agent.stats.executionCount - 1) + latency) / agent.stats.executionCount);
  await agent.save();

  return {
    agent: 'carbon-analytics',
    status: 'success',
    confidence: 0.97,
    recommendation: `Saved an estimated ${emissionsAvoided} kg CO₂ on this commute.`,
    reasoningSummary: `Sharing this ride with ${sharingCount} companions avoids solo driving emissions, offseting ${emissionsAvoided} kg CO₂.`,
    data: {
      emissionsAvoided,
      efficiencyScore,
      distance
    },
    latency
  };
};

module.exports = { analyzeCarbon };
