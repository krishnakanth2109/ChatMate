import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
const result = await mongoose.connection.db.collection('messages').deleteMany({ 
  messageType: 'image', 
  $or: [
    { fileUrl: null },
    { fileUrl: '' },
    { fileUrl: { $exists: false } }
  ]
});
console.log('Deleted broken image messages:', result.deletedCount);
process.exit(0);
