import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

export async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) return;

  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is missing in environment variables!');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas!');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
  }
}