const axios = require('axios');

/**
 * Clean up text parameter (remove filler search words)
 */
const cleanCity = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/(?:from|to|for|tomorrow|today|morning|afternoon|evening|night|cheap|affordable|best|electric|ev|women|only|rides?|find|around)/g, '')
    .trim();
};

/**
 * Regex-based offline NLP intent parser
 */
const parseRuleBased = (query) => {
  const params = {};
  const lower = query.toLowerCase();

  // 1. Origin & Destination parsing
  // Matches "from [City] to [City]"
  const fromToMatch = lower.match(/(?:from\s+)?([a-z\s]+?)\s+to\s+([a-z\s]+)/i);
  if (fromToMatch) {
    params.origin = cleanCity(fromToMatch[1]);
    params.destination = cleanCity(fromToMatch[2]);
  } else {
    // List of Indian cities to detect in text
    const cities = ['delhi', 'mumbai', 'bangalore', 'pune', 'hyderabad', 'chennai', 'kolkata', 'gurgaon', 'noida', 'jaipur', 'lucknow', 'prayagraj', 'kanpur', 'varanasi'];
    const foundCities = [];
    cities.forEach(city => {
      if (lower.includes(city)) {
        foundCities.push(city);
      }
    });

    if (foundCities.length >= 2) {
      params.origin = foundCities[0];
      params.destination = foundCities[1];
    } else if (foundCities.length === 1) {
      if (lower.includes(`to ${foundCities[0]}`) || lower.includes(`for ${foundCities[0]}`)) {
        params.destination = foundCities[0];
      } else {
        params.origin = foundCities[0];
      }
    }
  }

  // 2. Date parsing
  const today = new Date();
  if (lower.includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    params.date = tomorrow.toISOString().split('T')[0];
  } else if (lower.includes('today')) {
    params.date = today.toISOString().split('T')[0];
  } else {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const foundDay = days.find(day => lower.includes(day));
    if (foundDay) {
      const targetDayIndex = days.indexOf(foundDay);
      const currentDayIndex = today.getDay();
      let diff = targetDayIndex - currentDayIndex;
      if (diff <= 0) diff += 7;
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + diff);
      params.date = targetDate.toISOString().split('T')[0];
    }
  }

  // 3. Time categories
  if (lower.includes('morning')) {
    params.timeOfDay = 'morning';
  } else if (lower.includes('afternoon')) {
    params.timeOfDay = 'afternoon';
  } else if (lower.includes('evening')) {
    params.timeOfDay = 'evening';
  } else if (lower.includes('night')) {
    params.timeOfDay = 'night';
  }

  // Time hour matching (e.g. "8 am", "8pm", "8:00")
  const hourMatch = lower.match(/(\d{1,2})(?::\d{2})?\s*(am|pm)/i);
  if (hourMatch) {
    let hour = parseInt(hourMatch[1]);
    const ampm = hourMatch[2].toLowerCase();
    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
    params.hour = hour;
  }

  // 4. Preferences & Sorting modes
  if (lower.includes('cheap') || lower.includes('affordable') || lower.includes('low price')) {
    params.sortBy = 'price_low';
  } else if (lower.includes('best') || lower.includes('recommended')) {
    params.sortBy = 'best_match';
  }

  if (lower.includes('electric') || lower.includes('ev') || lower.includes('green') || lower.includes('eco')) {
    params.vehicleType = 'electric';
  }

  if (lower.includes('women only') || lower.includes('female') || lower.includes('women')) {
    params.womenOnly = true;
  }

  return params;
};

/**
 * Intelligent parser invoking Gemini API if available, falling back to rule-based parser.
 */
const parseIntent = async (query) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    console.log('🤖 Gemini API key missing, running rule-based NLP parser.');
    return parseRuleBased(query);
  }

  try {
    const systemPrompt = `You are a natural language parser for the Eco-Ride ride-sharing app. Analyze the query and extract search parameters. Return ONLY a valid JSON object without any backticks, markdown, or text wrapping. JSON properties:
- origin (String: city name, e.g. "Lucknow", "Delhi" or empty "")
- destination (String: city name or empty "")
- date (String: YYYY-MM-DD format if date is tomorrow/today/specific day of week, otherwise empty "")
- timeOfDay (String: "morning", "afternoon", "evening", "night" or empty "")
- sortBy (String: "price_low" if cheap/affordable is asked, "best_match" if best/recommended is asked, otherwise empty "")
- vehicleType (String: "electric" if electric/EV/hybrid/green is mentioned, otherwise empty "")
- womenOnly (Boolean: true if female/women only rides are mentioned, otherwise false)

Query: "${query}"`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        contents: [{ parts: [{ text: systemPrompt }] }]
      },
      { timeout: 4000 }
    );

    const generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (generatedText) {
      // Strip out markdown code fences if LLM returns them
      const cleanedJsonText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedJsonText);
      console.log('🔮 Gemini parsed intent:', parsed);
      return parsed;
    }
  } catch (error) {
    console.warn('⚠️ Gemini parsing failed or timed out. Falling back to rule-based parser:', error.message);
  }

  return parseRuleBased(query);
};

module.exports = {
  parseIntent,
  parseRuleBased
};
