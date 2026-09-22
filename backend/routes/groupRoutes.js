// backend/routes/groupRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Group from '../models/groupModel.js';
import User from '../models/userModel.js';

const router = express.Router();

// @route   POST /api/groups/create
// @desc    Create a new group
router.post('/create', protect, async (req, res) => {
    const { name, members } = req.body; // members is an array of user IDs
    try {
        const group = new Group({
            name,
            members: [...members, req.user.id], // Add the creator to the group
            admins: [req.user.id], // The creator is the first admin
        });
        await group.save();
        res.status(201).json(group);
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/groups
// @desc    Get all groups the user is a part of
router.get('/', protect, async (req, res) => {
    try {
        const groups = await Group.find({ members: req.user.id }).populate('members', 'name profilePicture');
        res.json(groups);
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

export default router;