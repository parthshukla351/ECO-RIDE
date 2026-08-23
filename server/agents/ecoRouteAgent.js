const Agent = require('../models/Agent');

/**
 * Evaluates route options to compare distance, duration, and carbon emissions.
 * @param {Object} params - origin, destination, distance (km), duration (mins)
 */
const analyzeRoute = async ({ origin, destination, distance = 10, duration = 15 }) => {
  const startTime = Date.now();
  const agent = await Agent.findOne({ agentId: 'eco-route' });
  
  if (!agent || !agent.enabled) {
    return { status: 'disabled', message: 'Eco Route Agent is inactive.' };
  }

  // Calculate carbon metrics deterministically
  const estimatedCO2 = parseFloat((distance * 0.12).toFixed(2)); // kg CO2
  
  // Provide alternative routing options
  const routeOptions = [
    {
      name: 'Route A (Eco Highway)',
      distance: parseFloat(distance),
      duration: parseFloat(duration),
      emissions: estimatedCO2,
      isEcoPick: true
    },
    {
      name: 'Route B (Alternate Bypass)',
      distance: parseFloat((distance * 1.12).toFixed(1)),
      duration: parseFloat((duration * 0.92).toFixed(0)), 
      emissions: parseFloat((estimatedCO2 * 1.18).toFixed(2)),
      isEcoPick: false
    }
  ];

  const latency = Date.now() - startTime;
  
  // Update agent telemetry
  agent.stats.executionCount += 1;
  agent.stats.successCount += 1;
  agent.stats.avgLatency = Math.round((agent.stats.avgLatency * (agent.stats.executionCount - 1) + latency) / agent.stats.executionCount);
  await agent.save();

  return {
    agent: 'eco-route',
    status: 'success',
    confidence: 0.95,
    recommendation: 'Route A (Eco Highway)',
    reasoningSummary: 'Route A is selected because it lowers estimated emissions by approximately 18% compared to Route B.',
    data: { routeOptions },
    latency
  };
};

module.exports = { analyzeRoute };
