const Agent = require('../models/Agent');

/**
 * Simulates route traffic forecasting based on day parameters and time slots.
 * @param {Object} params - routeCoords, departTime
 */
const predictTraffic = async ({ routeCoords = [], departTime = new Date() }) => {
  const startTime = Date.now();
  const agent = await Agent.findOne({ agentId: 'traffic-prediction' });

  if (!agent || !agent.enabled) {
    return { status: 'disabled', message: 'Traffic Prediction Agent is inactive.' };
  }

  const hour = new Date(departTime).getHours();
  let expectedDelay = 0;
  let trafficStatus = 'Light';

  // Rush hour traffic logic
  if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19)) {
    expectedDelay = 15; 
    trafficStatus = 'Heavy Congestion';
  } else if (hour >= 12 && hour <= 14) {
    expectedDelay = 5;
    trafficStatus = 'Moderate Traffic';
  }

  const latency = Date.now() - startTime;

  agent.stats.executionCount += 1;
  agent.stats.successCount += 1;
  agent.stats.avgLatency = Math.round((agent.stats.avgLatency * (agent.stats.executionCount - 1) + latency) / agent.stats.executionCount);
  await agent.save();

  return {
    agent: 'traffic-prediction',
    status: 'success',
    confidence: 0.85,
    recommendation: expectedDelay > 0 ? `Anticipate a +${expectedDelay} min traffic delay.` : 'Clear highway routing expected.',
    reasoningSummary: `Traffic flow is predicted as ${trafficStatus} with a simulated delay offset of +${expectedDelay} mins.`,
    data: {
      expectedDelay,
      trafficStatus
    },
    latency
  };
};

module.exports = { predictTraffic };
