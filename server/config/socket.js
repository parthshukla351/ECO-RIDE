const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // Join personal room
    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`👤 User ${userId} joined their room`);
    });

    // Join ride room for live tracking
    socket.on('joinRide', (rideId) => {
      socket.join(`ride_${rideId}`);
      console.log(`🚗 User joined ride room: ${rideId}`);
    });

    // Live location update
    socket.on('locationUpdate', ({ rideId, location }) => {
      socket.to(`ride_${rideId}`).emit('driverLocation', location);
    });

    // Chat message
    socket.on('sendMessage', ({ rideId, message }) => {
      io.to(`ride_${rideId}`).emit('newMessage', message);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket not initialized');
  return io;
};

module.exports = { initSocket, getIO };