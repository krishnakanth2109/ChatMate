// backend/models/userModel.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { 
    type: String, 
    default: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT3OKyqqzAbDYWct6RAm-2t20rR82xPbiEfAfxN0k1_Ow&s=10'
  },
  bio: { type: String, default: '' },
  preferences: {
    pushNotifications: { type: Boolean, default: true },
    theme: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' }
  },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // --- NEW FIELD ---
  pushToken: { type: String, default: null }, 
  // -----------------
  sentInvites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  receivedInvites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  unreadMessages: { type: Map, of: Boolean, default: {} },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
export default User;