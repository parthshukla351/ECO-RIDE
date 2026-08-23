const FAQ = require('../models/FAQ');

const seedFAQs = async () => {
  try {
    const count = await FAQ.countDocuments();
    if (count > 0) {
      console.log('📚 FAQ database already seeded.');
      return;
    }

    const platformFAQs = [
      {
        category: 'Rides',
        question: 'How do I publish a ride?',
        answer: 'Navigate to your dashboard, toggle to Driver mode, click "Publish Ride", and enter the origin, destination, seating availability, pricing, and preferred travel rules.',
        keywords: ['publish', 'create', 'share', 'driver', 'post'],
        relatedFeature: 'PublishRide'
      },
      {
        category: 'Booking',
        question: 'How can I book a ride?',
        answer: 'Search for your routing city from the search bar, look for verified matching rides, tap "View Details", choose seats, and confirm your booking request.',
        keywords: ['book', 'reserve', 'seats', 'passenger', 'request'],
        relatedFeature: 'SearchRide'
      },
      {
        category: 'Safety',
        question: 'What should I do if I feel unsafe?',
        answer: 'Open the floating Safety Center panel (shield icon) during any active trip immediately. You can slide the emergency slider to trigger an SOS alert, notify your primary contact, or quick-dial emergency services (112).',
        keywords: ['unsafe', 'danger', 'sos', 'emergency', 'help', 'threat'],
        relatedFeature: 'ActiveRideSafetyCenter'
      },
      {
        category: 'Safety',
        question: 'How do I share my live location?',
        answer: 'Open the Safety Center during your active trip, click "Share Live Location" to copy a secure time-limited tracking link, and send it to your trusted companions.',
        keywords: ['share', 'location', 'live', 'tracking', 'link'],
        relatedFeature: 'ShareTracking'
      },
      {
        category: 'Verification',
        question: 'How do I verify my identity?',
        answer: 'Go to your Account Configuration page, choose the "Driver Verification" tab, submit your driver license details, and submit for admin reviews.',
        keywords: ['verify', 'identity', 'license', 'driver', 'document'],
        relatedFeature: 'Profile'
      },
      {
        category: 'Wallet',
        question: 'How does the virtual wallet work?',
        answer: 'You can load funds using cards or netbanking via Razorpay. Your balance can be used directly for seamless ride payments. Drivers receive ride payments credited directly to their wallets.',
        keywords: ['wallet', 'money', 'balance', 'topup', 'funds', 'load'],
        relatedFeature: 'Wallet'
      },
      {
        category: 'Payments',
        question: 'Did my payment succeed?',
        answer: 'You can check your payment details inside your Payment History dashboard under "Transactions". The AI assistant can also query your latest payment status if you ask "did my payment succeed".',
        keywords: ['payment', 'success', 'history', 'transaction', 'status'],
        relatedFeature: 'PaymentHistory'
      },
      {
        category: 'Account',
        question: 'What does my trust score mean?',
        answer: 'Your trust score represents your safety and reliability index on Eco-Ride, starting at 75 and climbing up to 100 based on completed trips and driver credential verifications.',
        keywords: ['trust', 'score', 'safety', 'rating', 'reliability'],
        relatedFeature: 'Profile'
      }
    ];

    await FAQ.insertMany(platformFAQs);
    console.log('✅ Official Eco-Ride FAQs successfully seeded!');
  } catch (error) {
    console.error('❌ Failed to seed FAQs:', error.message);
  }
};

module.exports = seedFAQs;
