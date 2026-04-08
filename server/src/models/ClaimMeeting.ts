import mongoose, { Document, Schema, Types } from 'mongoose';

export type MeetingSource = 'verification' | 'manual_update';

export interface IClaimMeeting extends Document {
  claimId: Types.ObjectId;
  itemId: Types.ObjectId;
  verificationId: string;
  meetingLocation: string;
  meetingDateTime: Date;
  meetingDateTimeLocal?: string;
  meetingTimeZone?: string;
  meetingUtcOffsetMinutes?: number;
  source: MeetingSource;
  createdAt: Date;
  updatedAt: Date;
}

const claimMeetingSchema = new Schema<IClaimMeeting>(
  {
    claimId: {
      type: Schema.Types.ObjectId,
      ref: 'Claim',
      required: true,
      unique: true,
      index: true,
    },
    itemId: {
      type: Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
      index: true,
    },
    verificationId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    meetingLocation: {
      type: String,
      required: true,
      trim: true,
    },
    meetingDateTime: {
      type: Date,
      required: true,
      index: true,
    },
    meetingDateTimeLocal: {
      type: String,
      trim: true,
      default: null,
    },
    meetingTimeZone: {
      type: String,
      trim: true,
      default: null,
    },
    meetingUtcOffsetMinutes: {
      type: Number,
      default: null,
    },
    source: {
      type: String,
      enum: ['verification', 'manual_update'],
      required: true,
      default: 'manual_update',
    },
  },
  {
    timestamps: true,
    collection: 'claimmeetings',
  }
);

const ClaimMeeting = mongoose.model<IClaimMeeting>('ClaimMeeting', claimMeetingSchema);

export default ClaimMeeting;
