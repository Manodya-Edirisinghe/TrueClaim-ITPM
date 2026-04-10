import mongoose, { Document, Schema, Types } from 'mongoose';

export type ClaimStatus =
  | 'pending_verification'
  | 'claim_verified'
  | 'approved'
  | 'rejected';

export interface IClaimAlert {
  type: 'verification_started' | 'meeting_scheduled' | 'claim_decision';
  message: string;
  createdAt: Date;
}

export interface IClaim extends Document {
  itemId: Types.ObjectId;
  claimantName: string;
  claimantEmail: string;
  claimantContactNumber: string;
  ownershipPassword?: string;
  serialNumber?: string;
  lostPlace?: string;
  uniqueQuestion: string;
  uniqueAnswer: string;
  verificationId: string;
  verificationStartedAt: Date;
  verificationEndsAt: Date;
  meetingLocation?: string;
  meetingDateTime?: Date;
  status: ClaimStatus;
  alerts: IClaimAlert[];
  createdAt: Date;
  updatedAt: Date;
}

const claimAlertSchema = new Schema<IClaimAlert>(
  {
    type: {
      type: String,
      enum: ['verification_started', 'meeting_scheduled', 'claim_decision'],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const claimSchema = new Schema<IClaim>(
  {
    itemId: {
      type: Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
      index: true,
    },
    claimantName: {
      type: String,
      required: true,
      trim: true,
    },
    claimantEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    claimantContactNumber: {
      type: String,
      required: true,
      trim: true,
    },
    ownershipPassword: {
      type: String,
      trim: true,
      default: '',
    },
    serialNumber: {
      type: String,
      trim: true,
      default: '',
    },
    lostPlace: {
      type: String,
      trim: true,
      default: '',
    },
    uniqueQuestion: {
      type: String,
      required: true,
      trim: true,
    },
    uniqueAnswer: {
      type: String,
      required: true,
      trim: true,
    },
    verificationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    verificationStartedAt: {
      type: Date,
      required: true,
    },
    verificationEndsAt: {
      type: Date,
      required: true,
      index: true,
    },
    meetingLocation: {
      type: String,
      trim: true,
      default: null,
    },
    meetingDateTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending_verification', 'claim_verified', 'approved', 'rejected'],
      default: 'pending_verification',
      index: true,
    },
    alerts: {
      type: [claimAlertSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export const Claim = mongoose.model<IClaim>('Claim', claimSchema);
