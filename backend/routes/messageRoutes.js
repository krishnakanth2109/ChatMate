// backend/routes/messageRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Message from '../models/messageModel.js';
import User from '../models/userModel.js';

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

    // Find all messages where the sender and receiver are the two users
    const messages = await Message.find({
      $or: [
        { sender: loggedInUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: loggedInUserId },
      ],
    }).sort({ createdAt: 'asc' }); // Sort by creation time to get the correct order

    res.json(messages);

  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).send('Server Error');
  }
});

export default router;