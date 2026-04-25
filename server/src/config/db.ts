import mongoose from 'mongoose';
import './loadEnv';

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/trueclaim';

export const connectDatabase = async (): Promise<void> => {
  await mongoose.connect(MONGO_URI);
};
