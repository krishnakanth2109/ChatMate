// backend/config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// This is the new, more powerful storage configuration
export const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'chatmate_media', // A single folder for all media
    resource_type: "auto", // IMPORTANT: This lets Cloudinary detect the file type
    allowed_formats: ['jpeg', 'png', 'jpg', 'pdf', 'mp3', 'webm', 'm4a'], // Allowed formats
  },
});

export default cloudinary;