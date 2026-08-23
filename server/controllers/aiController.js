const axios = require('axios');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Ride = require('../models/Ride');
const { searchFAQ } = require('../services/faqService');
const { runOrchestrator, runCommutePipeline } = require('../services/agentOrchestrator');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// @desc    Calculate carbon offset
// @route   POST /api/ai/carbon
// @access  Public
exports.calculateCarbon = async (req, res) => {
  try {
    const { data } = await axios.post(`${AI_URL}/calculate/carbon`, req.body);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'AI service unavailable',
      error: error.message
    });
  }
};

// @desc    Predict ride pricing suggestion
// @route   POST /api/ai/pricing
// @access  Public
exports.predictPricing = async (req, res) => {
  try {
    const { data } = await axios.post(`${AI_URL}/predict/pricing`, req.body);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'AI service unavailable' });
  }
};

// @desc    Predict demand trends
// @route   POST /api/ai/demand
// @access  Public
exports.predictDemand = async (req, res) => {
  try {
    const { data } = await axios.post(`${AI_URL}/predict/demand`, req.body);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'AI service unavailable' });
  }
};

// @desc    Find ride matches
// @route   POST /api/ai/match
// @access  Public
exports.rideMatch = async (req, res) => {
  try {
    const { data } = await axios.post(`${AI_URL}/predict/ride-match`, req.body);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'AI service unavailable' });
  }
};

// @desc    Calculate safety score
// @route   POST /api/ai/safety
// @access  Public
exports.calculateSafety = async (req, res) => {
  try {
    const { data } = await axios.post(`${AI_URL}/score/safety`, req.body);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'AI service unavailable' });
  }
};

// @desc    Converse with Eco AI Assistant
// @route   POST /api/ai/chat
// @access  Private
exports.handleChatQuery = async (req, res) => {
  try {
    const { message, context = {} } = req.body;
    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const cleanMsg = message.toLowerCase().trim();

    // 1. SAFETY GATEWAY: If user indicates emergency danger, bypass chat and direct them to safety center
    if (cleanMsg.includes('unsafe') || cleanMsg.includes('danger') || cleanMsg.includes('sos') || cleanMsg.includes('emergency') || cleanMsg.includes('help me')) {
      return res.status(200).json({
        success: true,
        answer: '🚨 If you are in immediate danger or need assistance, please open the Safety Center now to slide the SOS trigger or call emergency services (112).',
        safetyAction: true,
        suggestions: ['Open Safety Center', 'Dial Emergency Contacts']
      });
    }

    // 1.5. AI AGENTS PIPELINE COORDINATOR: Handle multi-agent queries via orchestrator
    
    // Dynamic Pricing queries
    if (cleanMsg.includes('pricing') || cleanMsg.includes('fare') || cleanMsg.includes('cost') || cleanMsg.includes('price')) {
      const priceRes = await runOrchestrator('dynamic-pricing', 'pricing', { baseFare: 300, demandMultiplier: 1.06 }, req.user.id);
      return res.status(200).json({
        success: true,
        answer: `Estimated fare detail: Base fare is ₹${priceRes.data.baseFare}. ${priceRes.reasoningSummary} Final estimated price is ₹${priceRes.data.finalFare} (Adjustment: +₹${priceRes.data.demandAdjustment}).`,
        suggestions: ['Search rides', 'Wallet details']
      });
    }

    // Ride matching / comparison queries
    if (cleanMsg.includes('match') || cleanMsg.includes('best ride') || cleanMsg.includes('compare')) {
      const rides = await Ride.find({ status: 'scheduled' }).populate('driver', 'name averageRating').limit(2);
      if (rides.length > 0) {
        const matchRes = await runOrchestrator('ride-matching', 'matching', { rides }, req.user.id);
        const matchDetails = matchRes.data.matches.map(m => `\n• Driver ${m.driverName}: ${m.overallScore}% match score. (${m.reasoning})`).join('');
        return res.status(200).json({
          success: true,
          answer: `${matchRes.reasoningSummary} Available match alternatives evaluated:${matchDetails}`,
          suggestions: ['Search rides']
        });
      }
    }

    // Eco Route / alternate routes queries
    if (cleanMsg.includes('route') || cleanMsg.includes('eco pick') || cleanMsg.includes('emissions')) {
      const routeRes = await runOrchestrator('eco-route', 'routing', { distance: 20, duration: 30 }, req.user.id);
      return res.status(200).json({
        success: true,
        answer: `${routeRes.reasoningSummary} Options:\n• Route A: ${routeRes.data.routeOptions[0].distance} km, ${routeRes.data.routeOptions[0].duration} min (${routeRes.data.routeOptions[0].emissions} kg CO₂)\n• Route B: ${routeRes.data.routeOptions[1].distance} km, ${routeRes.data.routeOptions[1].duration} min (${routeRes.data.routeOptions[1].emissions} kg CO₂).`,
        suggestions: ['Search rides', 'Carbon Dashboard']
      });
    }

    // Traffic congestion queries
    if (cleanMsg.includes('traffic') || cleanMsg.includes('delay') || cleanMsg.includes('congestion')) {
      const trafficRes = await runOrchestrator('traffic-prediction', 'traffic', { departTime: new Date() }, req.user.id);
      return res.status(200).json({
        success: true,
        answer: `${trafficRes.reasoningSummary} Suggestion: ${trafficRes.recommendation}`,
        suggestions: ['Search rides']
      });
    }

    // Carbon emissions offset logs
    if (cleanMsg.includes('carbon') || cleanMsg.includes('offset') || cleanMsg.includes('co2') || cleanMsg.includes('savings')) {
      const carbonRes = await runOrchestrator('carbon-analytics', 'carbon', { distance: 15, sharingCount: 3 }, req.user.id);
      return res.status(200).json({
        success: true,
        answer: `${carbonRes.reasoningSummary} Eco efficiency rank is ${carbonRes.data.efficiencyScore}/100.`,
        suggestions: ['Carbon Dashboard', 'Search rides']
      });
    }

    // Safety telemetry anomalies
    if (cleanMsg.includes('safety check') || cleanMsg.includes('anomaly')) {
      const safetyRes = await runOrchestrator('driver-safety', 'safety', { stationaryMinutes: 12, routeDeviation: false }, req.user.id);
      return res.status(200).json({
        success: true,
        answer: `System status: ${safetyRes.data.safetyStatus}. ${safetyRes.reasoningSummary} Recommendation: ${safetyRes.recommendation}`,
        suggestions: ['Open Safety Center']
      });
    }

    // Support ticket escalation triggers
    if (cleanMsg.includes('support') || cleanMsg.includes('ticket') || cleanMsg.includes('issue') || cleanMsg.includes('wrong') || cleanMsg.includes('problem') || cleanMsg.includes('failed')) {
      return res.status(200).json({
        success: true,
        answer: `It looks like you need help with an account or payment issue. I can create a human support ticket for you.`,
        suggestions: ['Create Support Ticket', 'Wallet details']
      });
    }

    // 2. DETERMINISTIC TOOLS: Query databases directly for verified account facts
    
    // Tool A: Wallet balance info query
    if (cleanMsg.includes('wallet') || cleanMsg.includes('balance') || cleanMsg.includes('funds')) {
      const user = await User.findById(req.user.id);
      return res.status(200).json({
        success: true,
        answer: `Your virtual wallet balance is currently ₹${user.walletBalance.toFixed(2)}. You can top-up funds or check transactions in the Wallet screen.`,
        suggestions: ['Go to Wallet', 'Payment History']
      });
    }

    // Tool B: Payment history status query
    if (cleanMsg.includes('payment') || cleanMsg.includes('succeed') || cleanMsg.includes('transaction')) {
      const payment = await Payment.findOne({ user: req.user.id }).sort({ createdAt: -1 });
      if (payment) {
        return res.status(200).json({
          success: true,
          answer: `Your latest payment of ₹${payment.amount} (booking reference: ${payment.booking}) is currently ${payment.status?.toUpperCase()}.`,
          suggestions: ['Payment History', 'Wallet details']
        });
      } else {
        return res.status(200).json({
          success: true,
          answer: `I couldn't locate any recent payments associated with your profile. Please check your Payment History dashboard.`,
          suggestions: ['Go to Wallet']
        });
      }
    }

    // Tool C: Booking details / cancellation query
    if (cleanMsg.includes('booking') || cleanMsg.includes('my ride') || cleanMsg.includes('cancel')) {
      const booking = await Booking.findOne({ passenger: req.user.id })
        .sort({ createdAt: -1 })
        .populate('ride');
      if (booking && booking.ride) {
        return res.status(200).json({
          success: true,
          answer: `Your latest booking for the trip from ${booking.ride.origin?.city} to ${booking.ride.destination?.city} is currently ${booking.status?.toUpperCase()}.`,
          suggestions: ['My Bookings', 'Cancel booking']
        });
      }
    }

    // Tool D: Driver live location coordinates
    if (cleanMsg.includes('driver location') || cleanMsg.includes('where is my driver') || cleanMsg.includes('where is the driver')) {
      const activeBooking = await Booking.findOne({ passenger: req.user.id, status: 'confirmed' })
        .populate({ path: 'ride', populate: { path: 'driver', select: 'name phone' } });
      if (activeBooking && activeBooking.ride) {
        const ride = activeBooking.ride;
        if (ride.currentLocation && ride.currentLocation.lat) {
          return res.status(200).json({
            success: true,
            answer: `Your driver ${ride.driver?.name} is en route. The latest reported position coordinates are [${ride.currentLocation.lat.toFixed(5)}, ${ride.currentLocation.lng.toFixed(5)}].`,
            suggestions: ['Track Live Ride']
          });
        } else {
          return res.status(200).json({
            success: true,
            answer: `Your booking is confirmed with driver ${ride.driver?.name}, but they haven't started transmitting live location telemetry coordinates yet.`,
            suggestions: ['Go to Bookings']
          });
        }
      } else {
        return res.status(200).json({
          success: true,
          answer: `I could not locate an active confirmed booking for your profile. Ensure your driver has accepted your booking request.`,
          suggestions: ['Search rides']
        });
      }
    }

    // 3. FAQ KNOWLEDGE BASE LOOKUP: Search local MongoDB FAQs before LLM API
    const matchingFAQ = await searchFAQ(message);
    if (matchingFAQ) {
      console.log('📚 Hybrid FAQ Match:', matchingFAQ.question);
      return res.status(200).json({
        success: true,
        answer: matchingFAQ.answer,
        relatedFeature: matchingFAQ.relatedFeature,
        suggestions: [`How does ${matchingFAQ.category} work?`, 'Search rides']
      });
    }

    // 4. LLM API QUERY: Query Gemini model as fallback conversational assistant
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const user = await User.findById(req.user.id);
        const systemPrompt = `You are "Eco", the premium, friendly, and calm AI mobility assistant for the Eco-Ride ride-sharing app. Provide concise, brief, and helpful answers. Speak in plain text. Do not use markdown syntax, code fences, or emojis excessively.
Context:
- User's Name: ${user.name}
- User's Role: ${user.role}
- Current Page context: ${context.page || 'Home'}
- User query: "${message}"`;

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            contents: [{ parts: [{ text: systemPrompt }] }]
          },
          { timeout: 4000 }
        );

        const responseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (responseText) {
          return res.status(200).json({
            success: true,
            answer: responseText.trim(),
            suggestions: ['Find a ride', 'FAQ details']
          });
        }
      } catch (err) {
        console.warn('⚠️ Gemini chat call failed:', err.message);
      }
    }

    // 5. OFFLINE FALLBACK: Default response if Gemini and FAQs are not active
    return res.status(200).json({
      success: true,
      answer: "I'm having trouble connecting to my AI processor right now. However, you can still search for rides, top-up your wallet, or dial emergency safety services normally.",
      suggestions: ['Search rides', 'Wallet details', 'Emergency Contacts']
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
