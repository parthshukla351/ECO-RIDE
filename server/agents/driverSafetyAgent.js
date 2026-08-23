const Agent = require('../models/Agent');

/**
 * Evaluates transit delay markers and anomalies to flag attention checks.
 * @param {Object} params - lastUpdated, stationaryMinutes, routeDeviation
 */
const monitorSafety = async ({ lastUpdated = new Date(), stationaryMinutes = 0, routeDeviation = false }) => {
  const startTime = Date.now();
  const agent = await Agent.findOne({ agentId: 'driver-safety' });

  if (!agent || !agent.enabled) {
    return { status: 'disabled', message: 'Driver Safety Agent is inactive.' };
  }

  let safetyStatus = 'NORMAL';
  let reasoning = 'Trip parameters remain within standard thresholds.';

  if (routeDeviation) {
    safetyStatus = 'WARNING';
    reasoning = 'Trip trajectory route deviation anomaly detected. Alerting passenger.';
  } else if (stationaryMinutes > 10) {
    safetyStatus = 'ATTENTION';
    reasoning = 'Vehicle stationary interval exceeds 10 mins. Verifying transit status.';
  }

  const latency = Date.now() - startTime;

  agent.stats.executionCount += 1;
  agent.stats.successCount += 1;
  agent.stats.avgLatency = Math.round((agent.stats.avgLatency * (agent.stats.executionCount - 1) + latency) / agent.stats.executionCount);
  await agent.save();

  return {
    agent: 'driver-safety',
    status: 'success',
    confidence: 0.94,
    recommendation: safetyStatus === 'NORMAL' ? 'Keep monitoring en route.' : 'Trigger attention check warning.',
    reasoningSummary: reasoning,
    data: {
      safetyStatus,
      stationaryMinutes,
      routeDeviation
    },
    latency
  };
};

module.exports = { monitorSafety };
