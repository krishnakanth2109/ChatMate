import express from 'express';
import { protect, isAdmin } from '../middleware/authMiddleware.js';
import User from '../models/userModel.js';
import { sendPushNotification } from '../utils/notification.js';

const router = express.Router();

// @route   PUT /api/users/update-push-token
// @desc    Update the user's Expo push token for notifications
router.put('/update-push-token', protect, async (req, res) => {
    const { pushToken } = req.body;
    
    // Validate token if provided (null is allowed for logout)
    if (pushToken && typeof pushToken !== 'string') {
        return res.status(400).json({ msg: 'Invalid token format' });
    }

    try {
        await User.findByIdAndUpdate(req.user.id, { pushToken });
        res.json({ msg: 'Push token updated successfully' });
    } catch (error) {
        console.error("Error updating push token:", error.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/users/discover
// @desc    Discover ALL users on the platform (excluding self and existing connections)
router.get('/discover', protect, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const usersToExclude = [...currentUser.contacts, ...currentUser.sentInvites, ...currentUser.receivedInvites, req.user.id];
        const users = await User.find({ _id: { $nin: usersToExclude } }).select('name email profilePicture');
        res.json(users);
    } catch (error) {
        console.error("Error in /discover:", error.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/users/sync-contacts
// @desc    Find which of the user's email contacts are on the app
router.post('/sync-contacts', protect, async (req, res) => {
    const { emails } = req.body; // Expect an array of emails
    if (!emails || !Array.isArray(emails)) {
        return res.status(400).json({ msg: 'Please provide an array of emails.' });
    }
    try {
        const foundUsers = await User.find({ 
            email: { $in: emails }, 
            _id: { $ne: req.user.id } 
        }).select('name email profilePicture');
        res.json(foundUsers);
    } catch (error) {
        console.error("Error in /sync-contacts:", error.message);
        res.status(500).send('Server Error');
    }
});

// --- Existing Routes ---

router.post('/invite/:userId', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const targetUser = await User.findById(req.params.userId);
        
        if (!targetUser) return res.status(404).json({ msg: 'User not found' });
        
        if (user.sentInvites.includes(targetUser._id)) {
            return res.status(400).json({ msg: 'Invite already sent' });
        }
        
        user.sentInvites.push(targetUser._id);
        targetUser.receivedInvites.push(user._id);
        
        await user.save();
        await targetUser.save();
        
        // --- PUSH NOTIFICATION ---
        if (targetUser.pushToken) {
            await sendPushNotification(
                targetUser.pushToken,
                'New Friend Request',
                `${user.name} sent you a friend request!`,
                { type: 'friend_request', senderId: user._id }
            );
        }

        res.json({ msg: 'Invite sent' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/invite/accept/:userId', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const senderUser = await User.findById(req.params.userId);
        
        if (!senderUser) return res.status(404).json({ msg: 'User not found' });
        
        // Remove from invites lists
        user.receivedInvites = user.receivedInvites.filter(id => id.toString() !== senderUser._id.toString());
        senderUser.sentInvites = senderUser.sentInvites.filter(id => id.toString() !== user._id.toString());
        
        // Add to contacts
        user.contacts.push(senderUser._id);
        senderUser.contacts.push(user._id);
        
        await user.save();
        await senderUser.save();
        
        // --- PUSH NOTIFICATION ---
        if (senderUser.pushToken) {
            await sendPushNotification(
                senderUser.pushToken,
                'Friend Request Accepted',
                `${user.name} accepted your friend request!`,
                { type: 'friend_request_accepted', senderId: user._id }
            );
        }

        res.json({ msg: 'Invite accepted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/invites', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('receivedInvites', 'name email profilePicture');
        res.json(user.receivedInvites);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/contacts', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('contacts', 'name email profilePicture');
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const contactsWithStatus = user.contacts.map(contact => ({
            ...contact.toObject(),
            hasUnread: user.unreadMessages.get(contact._id.toString()) || false,
        }));
        res.json(contactsWithStatus);
    } catch (error) { 
        console.error(error.message);
        res.status(500).send('Server Error'); 
    }
});

router.post('/messages/mark-as-read', protect, async (req, res) => {
    try {
        const { senderId } = req.body;
        await User.findByIdAndUpdate(req.user.id, { $set: { [`unreadMessages.${senderId}`]: false } });
        res.status(200).json({ msg: 'Marked as read' });
    } catch (error) { res.status(500).send('Server Error'); }
});

router.get('/admin/all', protect, isAdmin, async (req, res) => {
    const users = await User.find({}).select('-password');
    res.json(users);
});

// @route   GET /api/users/me
// @desc    Get logged-in user's own profile
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/users/me/update
// @desc    Update own profile (name, profilePicture, bio, preferences)
router.put('/me/update', protect, async (req, res) => {
    const { name, profilePicture, bio, preferences } = req.body;
    try {
        const updateFields = {};
        if (name !== undefined) updateFields.name = name;
        if (profilePicture !== undefined) updateFields.profilePicture = profilePicture;
        if (bio !== undefined) updateFields.bio = bio;
        if (preferences) {
            if (preferences.pushNotifications !== undefined) updateFields['preferences.pushNotifications'] = preferences.pushNotifications;
            if (preferences.theme !== undefined) updateFields['preferences.theme'] = preferences.theme;
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateFields },
            { new: true }
        ).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

export default router;