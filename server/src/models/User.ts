import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  fullName: string;
  studentId: string;
  universityEmail: string;
  phoneNumber?: string;
  faculty: string;
  academicYear: string;
  password: string;
  role: 'user' | 'admin';
}

const UserSchema: Schema = new Schema(
  {
    fullName: { type: String, required: true },
    studentId: { type: String, required: true, unique: true },
    universityEmail: { type: String, required: true, unique: true },
    phoneNumber: { type: String },
    faculty: { type: String, required: true },
    academicYear: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);