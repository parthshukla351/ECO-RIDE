const Agent = require('../models/Agent');
const SupportTicket = require('../models/SupportTicket');

/**
 * Logs and escalates user issues to human support tickets in the database.
 * @param {Object} params - userId, category, subject, description, priority
 */
const handleSupport = async ({ userId, category = 'General', subject = 'Support Request', description = '', priority = 'NORMAL' }) => {
  const startTime = Date.now();
  const agent = await Agent.findOne({ agentId: 'customer-support' });

  if (!agent || !agent.enabled) {
    return { status: 'disabled', message: 'Customer Support Agent is inactive.' };
  }

  // Generate support ticket ID
  const ticketId = 'TKT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  const ticket = await SupportTicket.create({
    ticketId,
    user: userId,
    category,
    priority,
    subject,
    description,
    status: 'OPEN'
  });

  const latency = Date.now() - startTime;

  agent.stats.executionCount += 1;
  agent.stats.successCount += 1;
  agent.stats.avgLatency = Math.round((agent.stats.avgLatency * (agent.stats.executionCount - 1) + latency) / agent.stats.executionCount);
  await agent.save();

  return {
    agent: 'customer-support',
    status: 'success',
    confidence: 0.98,
    recommendation: `Created support ticket ${ticketId}.`,
    reasoningSummary: `Your request has been escalated. Support ticket ${ticketId} has been registered under category ${category}.`,
    data: {
      ticketId,
      category,
      priority,
      status: ticket.status
    },
    latency
  };
};

module.exports = { handleSupport };
