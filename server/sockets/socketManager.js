const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000
  });

  // Authentication middleware for sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication required'));
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Connected: ${socket.user.name} (${socket.id})`);

    // Join personal room
    socket.join(socket.user._id.toString());

    // Update user online status
    User.findByIdAndUpdate(socket.user._id, { 
      isOnline: true, 
      lastSeen: new Date() 
    }).exec();

    // ---- RIDE EVENTS ----
    socket.on('joinRide', (rideId) => {
      socket.join(`ride_${rideId}`);
      console.log(`🚗 ${socket.user.name} joined ride: ${rideId}`);
    });

    socket.on('leaveRide', (rideId) => {
      socket.leave(`ride_${rideId}`);
    });

    // ---- LIVE LOCATION ----
    socket.on('updateLocation', ({ rideId, location }) => {
      socket.to(`ride_${rideId}`).emit('driverLocationUpdate', {
        driverId: socket.user._id,
        location,
        timestamp: new Date()
      });
    });

    // ---- CHAT EVENTS ----
    socket.on('joinChat', (chatId) => {
      socket.join(`chat_${chatId}`);
    });

    socket.on('sendMessage', (messageData) => {
      io.to(`chat_${messageData.chatId}`).emit('newMessage', {
        ...messageData,
        sender: {
          _id: socket.user._id,
          name: socket.user.name,
          avatar: socket.user.avatar
        },
        timestamp: new Date()
      });
    });

    socket.on('typing', ({ chatId, isTyping }) => {
      socket.to(`chat_${chatId}`).emit('userTyping', {
        userId: socket.user._id,
        name: socket.user.name,
        isTyping
      });
    });

    // ---- RIDE STATUS ----
    socket.on('rideStatusUpdate', ({ rideId, status }) => {
      io.to(`ride_${rideId}`).emit('rideStatusChanged', { rideId, status });
    });

    // ---- SOS ----
    socket.on('sosAlert', ({ rideId, location }) => {
      io.emit('sosReceived', {
        userId: socket.user._id,
        userName: socket.user.name,
        rideId,
        location,
        timestamp: new Date()
      });
    });

    // ---- DISCONNECT ----
    socket.on('disconnect', () => {
      console.log(`🔌 Disconnected: ${socket.user.name}`);
      User.findByIdAndUpdate(socket.user._id, {
        isOnline: false,
        lastSeen: new Date()
      }).exec();
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

const emitToUser = (userId, event, data) => {
  if (io) io.to(userId.toString()).emit(event, data);
};

const emitToRide = (rideId, event, data) => {
  if (io) io.to(`ride_${rideId}`).emit(event, data);
};

module.exports = { initSocket, getIO, emitToUser, emitToRide };