import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import axios from 'axios';
import fs from 'fs';
import mongoose from 'mongoose';
import { Expo } from 'expo-server-sdk'; // Import Expo SDK

import connectDB from './config/db.js';
import Message from './models/messageModel.js';
import User from './models/userModel.js';
import { storage as cloudinaryStorage } from './config/cloudinary.js';
import { sendPushNotification } from './utils/notification.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

dotenv.config();
connectDB();

const app = express();

// --- PRODUCTION-READY CORS CONFIGURATION ---
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5000',
      'http://localhost:8081', // Expo Web
      process.env.FRONTEND_URL,
      process.env.PRODUCTION_FRONTEND_URL,
      'https://ourchatmate.netlify.app',
      'https://chatmate-lx08.onrender.com'
    ].filter(Boolean);

    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

// --- MIDDLEWARE SETUP ---
app.use(cors(corsOptions));
app.use(express.json());

// Public uploads folder (fallback if not using Cloudinary)
const uploadDir = 'public/uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Media Upload Route
const mediaUpload = multer({ storage: cloudinaryStorage });
app.post('/api/upload/media', mediaUpload.single('media'), (req, res) => {
  if (!req.file) return res.status(400).json({ msg: 'No file uploaded.' });
  res.json({ filePath: req.file.path, fileName: req.file.originalname });
});

// --- API ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// --- DEPLOYMENT HEALTH CHECKS ---
app.get('/', (req, res) => {
  res.json({ 
    message: 'ChatMate Backend API is running!',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// --- SERVER & SOCKET SETUP ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: { 
    origin: corsOptions.origin,
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

const userSocketMap = {};

// Helper to format notification body based on message type
const getNotificationBody = (type, content) => {
  switch (type) {
    case 'image': return '📷 Sent a photo';
    case 'voice': return '🎤 Sent a voice message';
    case 'location': return '📍 Shared a location';
    case 'document': return '📄 Sent a document';
    case 'text': 
    default: return content;
  }
};

io.on('connection', (socket) => {
  // Support both query strings and Socket.IO v4+ auth payloads
  const userId = socket.handshake.query.userId || socket.handshake.auth?.userId;
  if (userId) {
    if (!userSocketMap[userId]) {
      userSocketMap[userId] = new Set();
    }
    userSocketMap[userId].add(socket.id);
    io.emit('getOnlineUsers', Object.keys(userSocketMap));
  }

  // --- EVENTS ---

  socket.on('send_invite', ({ receiverId }) => {
    const receiverSocketIds = userSocketMap[receiverId];
    if (receiverSocketIds) {
      receiverSocketIds.forEach(socketId => io.to(socketId).emit('new_invite'));
    }
  });

  socket.on('accept_invite', ({ senderId }) => {
    const senderSocketIds = userSocketMap[senderId];
    if (senderSocketIds) {
      senderSocketIds.forEach(socketId => io.to(socketId).emit('invite_accepted'));
    }
  });

  socket.on('send_message', async (data) => {
    try {
      const { sender: senderId, receiver: receiverId, messageType, content, fileUrl, fileName, location } = data;
      const sender = await User.findById(senderId);
      
      // 1. Validation
      if (!sender || !sender.contacts.includes(receiverId)) {
        return socket.emit('error', { message: 'You are not connected with this user.' });
      }

      // 2. Construct Message Data
      let newMessageData = { sender: senderId, receiver: receiverId, messageType, content, fileUrl, fileName, location };
      
      // Handle Location (Reverse Geocoding)
      if (messageType === 'location') {
        const { lat, lng } = location;
        try {
          const response = await axios.get(`https://us1.locationiq.com/v1/reverse.php?key=${process.env.LOCATIONIQ_API_KEY}&lat=${lat}&lon=${lng}&format=json`);
          newMessageData.location.address = response.data.display_name;
        } catch (locError) {
          console.error("Location lookup failed", locError.message);
        }
      }
      
      // 3. Save to DB
      const newMessage = new Message(newMessageData);
      await newMessage.save();

      const receiverSocketIds = userSocketMap[receiverId];
      
      // 4. Send via Socket (if Online)
      let isOnline = false;
      if (receiverSocketIds && receiverSocketIds.size > 0) {
        isOnline = true;
        receiverSocketIds.forEach(socketId => {
          io.to(socketId).emit('receive_message', newMessage);
          io.to(socketId).emit('new_message_notification', { senderId });
        });
        await User.findByIdAndUpdate(receiverId, { $set: { [`unreadMessages.${senderId}`]: true } });
      }
      
      // 5. Send Push Notification (Logic for Offline/Background)
      if (!isOnline) {
        const receiver = await User.findById(receiverId);
        if (receiver && receiver.pushToken) {
          const notificationBody = getNotificationBody(messageType, content);
          await sendPushNotification(
            receiver.pushToken,
            sender.name,
            notificationBody,
            { 
              type: 'new_message', 
              senderId: senderId,
              senderName: sender.name, 
              messageId: newMessage._id 
            }
          );
        }
      }

      // Acknowledge sender (loopback)
      socket.emit('receive_message', newMessage);

    } catch (error) {
      console.error("Error sending message:", error);
    }
  });

  socket.on('delete_message', async ({ messageId, userId }) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(messageId)) return;
      const message = await Message.findById(messageId);
      if (!message || message.sender.toString() !== userId) return;
      
      await Message.findByIdAndDelete(messageId);
      
      const receiverSocketIds = userSocketMap[message.receiver.toString()];
      if (receiverSocketIds) {
        receiverSocketIds.forEach(socketId => io.to(socketId).emit('message_deleted', { messageId }));
      }
      socket.emit('message_deleted', { messageId });
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  });

  // --- WEBRTC CALLING EVENTS ---
  socket.on('call_user', ({ userToCall, signalData, from, name }) => {
    const receiverSocketIds = userSocketMap[userToCall];
    if (receiverSocketIds) {
      receiverSocketIds.forEach(socketId => io.to(socketId).emit('incoming_call', { signal: signalData, from, name }));
    }
  });

  socket.on('answer_call', ({ to, signal }) => {
    const callerSocketIds = userSocketMap[to];
    if (callerSocketIds) {
      callerSocketIds.forEach(socketId => io.to(socketId).emit('call_accepted', signal));
    }
  });

  socket.on('reject_call', ({ to }) => {
    const callerSocketIds = userSocketMap[to];
    if (callerSocketIds) {
      callerSocketIds.forEach(socketId => io.to(socketId).emit('call_rejected'));
    }
  });

  socket.on('end_call', ({ to }) => {
    const peerSocketIds = userSocketMap[to];
    if (peerSocketIds) {
      peerSocketIds.forEach(socketId => io.to(socketId).emit('call_ended'));
    }
  });

  socket.on('ice_candidate', ({ to, candidate }) => {
    const peerSocketIds = userSocketMap[to];
    if (peerSocketIds) {
      peerSocketIds.forEach(socketId => io.to(socketId).emit('ice_candidate', candidate));
    }
  });

  socket.on('disconnect', () => {
    for (const id in userSocketMap) {
      if (userSocketMap[id].has(socket.id)) {
        userSocketMap[id].delete(socket.id);
        if (userSocketMap[id].size === 0) {
          delete userSocketMap[id];
        }
        break;
      }
    }
    io.emit('getOnlineUsers', Object.keys(userSocketMap));
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));