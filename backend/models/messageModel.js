// backend/models/messageModel.js
import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema({
  emoji: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { _id: false });

const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // For groups, this could be the group ID
  messageType: {
    type: String,
    enum: ['text', 'voice', 'location', 'image', 'document'],
    required: true,
  },
  content: { type: String },
  fileUrl: { type: String },
  fileName: { type: String },
  location: { lat: Number, lng: Number, address: String },
  reactions: [reactionSchema],
}, { timestamps: true });

const Message = mongoose.model('Message', MessageSchema);
export default Message;