import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

type MongoCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongoCache | undefined;
}

const cached: MongoCache = global.mongooseCache || { conn: null, promise: null };
if (process.env.NODE_ENV !== 'production') global.mongooseCache = cached;

export async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) return mongoose;

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is missing in environment variables.');
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    throw error;
  }
}
