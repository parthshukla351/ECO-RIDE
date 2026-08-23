const Agent = require('../models/Agent');

/**
 * Calculates demand adjustments within strict, verified pricing caps (max +10%).
 * @param {Object} params - baseFare, demandMultiplier
 */
const calculatePricing = async ({ baseFare = 100, demandMultiplier = 1.0 }) => {
  const startTime = Date.now();
  const agent = await Agent.findOne({ agentId: 'dynamic-pricing' });

  if (!agent || !agent.enabled) {
    return { status: 'disabled', message: 'Dynamic Pricing Agent is inactive.' };
  }

  // Determine pricing adjustment (clamped between 0% and 10% max surge adjustment)
  let rawAdjustment = parseFloat(demandMultiplier) - 1.0;
  if (rawAdjustment < 0) rawAdjustment = 0;
  if (rawAdjustment > 0.10) rawAdjustment = 0.10; 

  const demandAdjustment = parseFloat((baseFare * rawAdjustment).toFixed(2));
  const finalFare = parseFloat((baseFare + demandAdjustment).toFixed(2));

  const latency = Date.now() - startTime;

  agent.stats.executionCount += 1;
  agent.stats.successCount += 1;
  agent.stats.avgLatency = Math.round((agent.stats.avgLatency * (agent.stats.executionCount - 1) + latency) / agent.stats.executionCount);
  await agent.save();

  return {
    agent: 'dynamic-pricing',
    status: 'success',
    confidence: 0.89,
    recommendation: `Apply dynamic adjustment of +${(rawAdjustment * 100).toFixed(0)}%`,
    reasoningSummary: rawAdjustment > 0 
      ? `Dynamic adjustment of +${(rawAdjustment * 100).toFixed(0)}% applied due to high commute demand.`
      : 'Standard fare applied. Passenger demand is balanced.',
    data: {
      baseFare,
      demandAdjustment,
      finalFare,
      adjustmentPercent: parseFloat((rawAdjustment * 100).toFixed(0))
    },
    latency
  };
};

module.exports = { calculatePricing };
