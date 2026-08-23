const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Agent = require('../models/Agent');
const AgentExecution = require('../models/AgentExecution');
const SupportTicket = require('../models/SupportTicket');
const CarbonRecord = require('../models/CarbonRecord');
const { runOrchestrator, runCommutePipeline } = require('../services/agentOrchestrator');

// @desc    Get all registered agents
// @route   GET /api/agents
// @access  Private (Admin)
router.get('/', protect, async (req, res) => {
  try {
    const agents = await Agent.find({});
    res.json({ success: true, agents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Toggle agent enabled status
// @route   PUT /api/agents/:agentId/toggle
// @access  Private (Admin)
router.put('/:agentId/toggle', protect, async (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = await Agent.findOne({ agentId });
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }
    agent.enabled = !agent.enabled;
    agent.status = agent.enabled ? 'ACTIVE' : 'INACTIVE';
    await agent.save();
    res.json({ success: true, agent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all executions logs
// @route   GET /api/agents/executions
// @access  Private (Admin)
router.get('/executions', protect, async (req, res) => {
  try {
    const logs = await AgentExecution.find({}).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all support tickets
// @route   GET /api/agents/tickets
// @access  Private
router.get('/tickets', protect, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { user: req.user.id };
    const tickets = await SupportTicket.find(query).sort({ createdAt: -1 });
    res.json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a support ticket manually or via chatbot escalation
// @route   POST /api/agents/support/ticket
// @access  Private
router.post('/support/ticket', protect, async (req, res) => {
  try {
    const { category, subject, description, priority } = req.body;
    const result = await runOrchestrator('customer-support', 'ticket_creation', {
      category,
      subject,
      description,
      priority
    }, req.user.id);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get carbon saving logs for user
// @route   GET /api/agents/carbon/logs
// @access  Private
router.get('/carbon/logs', protect, async (req, res) => {
  try {
    const logs = await CarbonRecord.find({ user: req.user.id }).populate('ride');
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Evaluate a complete travel route via multi-agent pipeline
// @route   POST /api/agents/commute-pipeline
// @access  Private
router.post('/commute-pipeline', protect, async (req, res) => {
  try {
    const { origin, destination, distance, baseFare, rides = [] } = req.body;
    const result = await runCommutePipeline({ origin, destination, distance, baseFare, rides }, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
