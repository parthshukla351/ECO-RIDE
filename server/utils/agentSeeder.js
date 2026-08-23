const Agent = require('../models/Agent');

const seedAgents = async () => {
  try {
    const count = await Agent.countDocuments();
    if (count > 0) {
      console.log('🤖 AI Agents registry already seeded.');
      return;
    }

    const defaultAgents = [
      {
        agentId: 'eco-route',
        name: 'Eco Route Agent',
        description: 'Analyzes route alternative detours and coordinates optimal emissions offsets.',
        version: '1.0.0',
        status: 'ACTIVE',
        permissions: ['READ_ROUTE', 'READ_MAP', 'READ_TRAFFIC'],
        capabilities: ['Route optimization', 'CO2 comparison', 'Detour calculation']
      },
      {
        agentId: 'dynamic-pricing',
        name: 'Dynamic Pricing Agent',
        description: 'Computes supply/demand adjustments within safe limits.',
        version: '1.0.0',
        status: 'ACTIVE',
        permissions: ['READ_BOOKINGS', 'READ_RIDES', 'CALCULATE_FARES'],
        capabilities: ['Fare estimation', 'Congestion indexing', 'Surge balancing']
      },
      {
        agentId: 'ride-matching',
        name: 'Ride Matching Agent',
        description: 'Calculates user route overlap percentage and trip compatibility rankings.',
        version: '1.0.0',
        status: 'ACTIVE',
        permissions: ['READ_RIDES', 'READ_PROFILES'],
        capabilities: ['Compatibility scoring', 'Ranked matching', 'detour validation']
      },
      {
        agentId: 'traffic-prediction',
        name: 'Traffic Prediction Agent',
        description: 'Predicts traffic congestion levels and estimates arrival delay offsets.',
        version: '1.0.0',
        status: 'ACTIVE',
        permissions: ['READ_MAPS', 'READ_TRAFFIC'],
        capabilities: ['Delay forecasting', 'ETA adjustments', 'Route congestion warnings']
      },
      {
        agentId: 'carbon-analytics',
        name: 'Carbon Analytics Agent',
        description: 'Estimates carpool offsets and overall environmental trip indices.',
        version: '1.0.0',
        status: 'ACTIVE',
        permissions: ['READ_RIDES', 'WRITE_ANALYTICS'],
        capabilities: ['Carbon reporting', 'Eco rank grading', 'Savings verification']
      },
      {
        agentId: 'driver-safety',
        name: 'Driver Safety Agent',
        description: 'Tracks transit telemetry anomalies and reports trip duration alerts.',
        version: '1.0.0',
        status: 'ACTIVE',
        permissions: ['READ_LOCATION', 'READ_SAFETY'],
        capabilities: ['Deviation flagging', 'Delay diagnostics', 'Safety score updates']
      },
      {
        agentId: 'customer-support',
        name: 'Customer Support Agent',
        description: 'Escalates user queries to official support tickets.',
        version: '1.0.0',
        status: 'ACTIVE',
        permissions: ['READ_TICKETS', 'WRITE_TICKETS'],
        capabilities: ['FAQ resolution', 'Escalation routing', 'Ticket logging']
      }
    ];

    await Agent.insertMany(defaultAgents);
    console.log('✅ AI Agent ecosystem registry successfully seeded!');
  } catch (error) {
    console.error('❌ Failed to seed AI Agents registry:', error.message);
  }
};

module.exports = seedAgents;
