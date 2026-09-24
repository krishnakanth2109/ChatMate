// backend/routes/messageRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Message from '../models/messageModel.js';
import User from '../models/userModel.js';
import { sendPushNotification } from '../utils/notification.js';

const router = express.Router();

// @route   GET /api/messages/:userId
// @desc    Get message history between logged-in user and another user
// @access  Private
router.get('/:userId', protect, async (req, res) => {
  try {
    const loggedInUserId = req.user.id;
    const otherUserId = req.params.userId;

    // Security check: Ensure the other user is in the contact list
    const user = await User.findById(loggedInUserId);
    if (!user.contacts.includes(otherUserId)) {
      return res.status(403).json({ msg: 'You are not connected with this user.' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Find all messages where the sender and receiver are the two users
    const messages = await Message.find({
      $or: [
        { sender: loggedInUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: loggedInUserId },
      ],
    })
      .sort({ createdAt: 'desc' }) // Get latest first
      .skip(skip)
      .limit(limit);

    // Return descending for inverted FlatList
    res.json(messages);

  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/messages
// @desc    Send a message via REST API
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiver: receiverId, messageType, content, fileUrl, fileName, location } = req.body;
    
    const sender = await User.findById(senderId);
    if (!sender || !sender.contacts.includes(receiverId)) {
      return res.status(403).json({ status: 'error', message: 'You are not connected with this user.' });
    }

    let newMessageData = { sender: senderId, receiver: receiverId, messageType, content, fileUrl, fileName, location };

    if (messageType === 'location') {
      try {
        const io = req.app.get('io'); // temporarily require axios for reverse geocoding if needed, but we skip it here for brevity or assume client sends lat/lng in content
      } catch (e) {
        console.error("Geocoding failed", e);
      }
    }

    const newMessage = new Message(newMessageData);
    await newMessage.save();

    const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'name profilePic');

    const io = req.app.get('io');
    const userSocketMap = req.app.get('userSocketMap');

    // Notify Receiver
    const receiverSocketIds = userSocketMap[receiverId];
    if (receiverSocketIds && receiverSocketIds.size > 0) {
      receiverSocketIds.forEach(socketId => {
        io.to(socketId).emit('receive_message', populatedMessage);
        io.to(socketId).emit('new_message_notification', { senderId });
      });
    }

    // Send push notification
    const receiver = await User.findById(receiverId);
    if (receiver && receiver.pushToken) {
      let pushBody = content;
      if (messageType === 'image') pushBody = '📷 Sent a photo';
      if (messageType === 'document') pushBody = '📄 Sent a document';
      if (messageType === 'location') pushBody = '📍 Shared a location';

      sendPushNotification(receiver.pushToken, `New message from ${sender.name}`, pushBody, {
        type: 'new_message',
        senderId: sender._id,
        senderName: sender.name,
      });
    }

    res.json({ status: 'ok', data: populatedMessage });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ status: 'error', message: 'Server Error' });
  }
});

export default router;