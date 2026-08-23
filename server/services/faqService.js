const FAQ = require('../models/FAQ');

/**
 * Searches the structured FAQ database for keywords matching the query.
 * @param {String} queryText - Raw input string from the user.
 * @returns {Object|null} - Matching FAQ document or null.
 */
const searchFAQ = async (queryText) => {
  if (!queryText) return null;
  const lowerQuery = queryText.toLowerCase().trim();

  // Fetch all FAQs (since knowledge base is lightweight/curated)
  const faqs = await FAQ.find({});
  
  // Find standard keyword overlaps
  for (const faq of faqs) {
    const matchedKeyword = faq.keywords.some(keyword => {
      // Direct substring match or boundary overlap
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      return regex.test(lowerQuery);
    });

    if (matchedKeyword) {
      return faq;
    }
  }

  return null;
};

module.exports = {
  searchFAQ
};
