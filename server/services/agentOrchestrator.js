const Agent = require('../models/Agent');
const AgentExecution = require('../models/AgentExecution');
const { analyzeRoute } = require('../agents/ecoRouteAgent');
const { calculatePricing } = require('../agents/dynamicPricingAgent');
const { matchRides } = require('../agents/rideMatchingAgent');
const { predictTraffic } = require('../agents/trafficPredictionAgent');
const { analyzeCarbon } = require('../agents/carbonAnalyticsAgent');
const { monitorSafety } = require('../agents/driverSafetyAgent');
const { handleSupport } = require('../agents/customerSupportAgent');

/**
 * Coordinate tasks between multiple agents and log results.
 */
const runOrchestrator = async (agentId, taskType, payload, userId = null) => {
  const startTime = Date.now();
  let status = 'success';
  let result = null;

  try {
    // 1. Enforce agent activation status
    const agent = await Agent.findOne({ agentId });
    if (!agent || !agent.enabled) {
      return { status: 'inactive', message: `Agent ${agentId} is disabled.` };
    }

    // 2. Delegate to active agents
    switch (agentId) {
      case 'eco-route':
        result = await analyzeRoute(payload);
        break;
      case 'dynamic-pricing':
        result = await calculatePricing(payload);
        break;
      case 'ride-matching':
        result = await matchRides(payload);
        break;
      case 'traffic-prediction':
        result = await predictTraffic(payload);
        break;
      case 'carbon-analytics':
        result = await analyzeCarbon(payload);
        break;
      case 'driver-safety':
        result = await monitorSafety(payload);
        break;
      case 'customer-support':
        result = await handleSupport({ ...payload, userId });
        break;
      default:
        throw new Error(`Unknown agent: ${agentId}`);
    }

    // 3. Log agent execution details
    const latency = Date.now() - startTime;
    await AgentExecution.create({
      agentId,
      userId,
      requestType: taskType,
      status: 'success',
      confidence: result.confidence || 1.0,
      latency,
      resultSummary: result.reasoningSummary || 'Completed successfully'
    });

    return result;
  } catch (error) {
    status = 'failure';
    const latency = Date.now() - startTime;
    await AgentExecution.create({
      agentId,
      userId,
      requestType: taskType,
      status: 'failure',
      confidence: 0.0,
      latency,
      resultSummary: `Error: ${error.message}`
    });

    // Update agent errors count
    const agent = await Agent.findOne({ agentId });
    if (agent) {
      agent.stats.executionCount += 1;
      agent.stats.errorCount += 1;
      await agent.save();
    }

    return { status: 'error', message: error.message };
  }
};

/**
 * Multi-Agent Pipeline: Evaluates route travel compatibility and delay offsets together.
 */
const runCommutePipeline = async ({ origin, destination, distance, baseFare, rides = [] }, userId = null) => {
  // Execute Matching, Route, Traffic, and Carbon agents together
  const [matchingResult, routeResult, trafficResult] = await Promise.all([
    runOrchestrator('ride-matching', 'matching', { rides }, userId),
    runOrchestrator('eco-route', 'routing', { origin, destination, distance }, userId),
    runOrchestrator('traffic-prediction', 'traffic', { departTime: new Date() }, userId)
  ]);

  // Dynamic pricing bounds validation
  const demandAdjustment = trafficResult.data?.expectedDelay > 10 ? 1.08 : 1.0; // surge multiplier
  const pricingResult = await runOrchestrator('dynamic-pricing', 'pricing', { baseFare, demandMultiplier: demandAdjustment }, userId);

  // Carbon estimates
  const carbonResult = await runOrchestrator('carbon-analytics', 'carbon', { distance, sharingCount: rides.length + 1 }, userId);

  // Resolve conflicts: if traffic delay is severe, warn passenger and suggest alternative Route B
  let reconciledRecommendation = 'Route A is optimal and low-emission.';
  if (trafficResult.data?.expectedDelay > 10) {
    reconciledRecommendation = 'Route A remains optimal, but anticipate heavy traffic. Route B provides alternative speedups.';
  }

  return {
    success: true,
    matching: matchingResult.data,
    routing: routeResult.data,
    traffic: trafficResult.data,
    pricing: pricingResult.data,
    carbon: carbonResult.data,
    reconciledRecommendation
  };
};

module.exports = {
  runOrchestrator,
  runCommutePipeline
};
