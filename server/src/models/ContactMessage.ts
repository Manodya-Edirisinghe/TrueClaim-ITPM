import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 180 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    sourcePage: { type: String, default: 'landing-contact' },
  },
  { timestamps: true }
);

export default mongoose.model('ContactMessage', contactMessageSchema);
