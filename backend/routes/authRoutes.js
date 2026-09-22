// backend/routes/authRoutes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- SIMPLE, DIRECT REGISTRATION (NO OTP) ---
// @route   POST /api/auth/register
// @desc    Register a new user directly with name, email, and password
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User with this email already exists' });
    }

    user = new User({ name, email, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const payload = { 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      } 
    };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' }, (err, token) => {
      if (err) throw err;
      res.status(201).json({ token });
    });
  } catch (err) {
    console.error("Registration Error:", err.message);
    res.status(500).send('Server Error');
  }
});


// --- FLEXIBLE LOGIN (EMAIL OR NAME) - NO OTP ---
// @route   POST /api/auth/login
// @desc    Login user with either email OR name and password
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
      return res.status(400).json({ msg: 'Please enter all fields' });
  }

  try {
    // Intelligently check if the username is an email or a name
    const isEmail = username.includes('@');
    const query = isEmail ? { email: username } : { name: username };
    
    let user = await User.findOne(query);
    if (!user) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
    }
    
    const payload = { 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      } 
    };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/auth/me/password
// @desc    Change user password
router.put('/me/password', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ msg: 'New password must be at least 6 characters' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid current password' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ msg: 'Password updated successfully' });
  } catch (error) {
    console.error("Error updating password:", error.message);
    res.status(500).send('Server Error');
  }
});

export default router;