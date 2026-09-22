// backend/models/groupModel.js
import mongoose from 'mongoose';

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  groupIcon: { type: String, default: 'default_group_icon_url' },
}, { timestamps: true });

const Group = mongoose.model('Group', GroupSchema);
export default Group;