const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const http = require('http');
const cookieParser = require('cookie-parser');
const { initSocket } = require('./sockets/socketManager');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(cookieParser());

// =========================
// CORS CONFIGURATION
// =========================

const allowedOrigins = [
  '',
  'https://eco-ride-xi.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000'
].filter(Boolean);

console.log('Allowed Origins:', allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without origin
      if (!origin) {
        return callback(null, true);
      }

      // Allow Vercel deployment URLs
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }

      console.log('Blocked by CORS:', origin);

      return callback(
        new Error('Not allowed by CORS')
      );
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization'
    ]
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// ROUTES
// =========================

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/rides', require('./routes/rideRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/safety', require('./routes/safetyRoutes'));
app.use('/api/agents', require('./routes/agentRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// =========================
// HEALTH CHECK
// =========================

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Eco Ride Sharing API is running',
    timestamp: new Date().toISOString()
  });
});

// =========================
// ERROR HANDLER
// =========================

app.use(require('./middleware/errorHandler'));

// =========================
// DATABASE CONNECTION
// =========================

const seedFAQs = require('./utils/faqSeeder');
const seedAgents = require('./utils/agentSeeder');

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected');

    try {
      await seedFAQs();
      await seedAgents();
    } catch (error) {
      console.error('⚠️ Seeding error:', error.message);
    }

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });