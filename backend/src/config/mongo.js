import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/candidate_trust_db';

let isMongoConnected = false;

export const connectMongoDB = async () => {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
      autoIndex: true
    });
    isMongoConnected = true;
    console.log(`🍃 Connected to MongoDB at ${MONGODB_URI}`);
  } catch (err) {
    isMongoConnected = false;
    console.warn(`⚠️ MongoDB connection skipped (${err.message}). Dual-storage active.`);
  }
};

export const getMongoStatus = () => isMongoConnected;

