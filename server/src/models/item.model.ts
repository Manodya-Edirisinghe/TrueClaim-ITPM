import { Schema, model, Document, Types } from 'mongoose';

export interface IItem extends Document {
  itemType: 'lost' | 'found';
  itemTitle: string;
  itemCategory: string;
  description: string;
  time: Date;
  location: string;
  contactNumber: string;
  imageUrl?: string;
  imagePublicId?: string;
  hasOwner: boolean;
  claimStatus: 'open' | 'under_verification' | 'claim_verified' | 'claimed';
  ownerClaimId?: Types.ObjectId;
  needsOwnerReclaim: boolean;
  claimableQueueStartedAt?: Date | null;
  claimableQueueEndsAt?: Date | null;
  claimableQueuePaused: boolean;
  claimableQueueRemainingMs?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<IItem>(
  {
    itemType: {
      type: String,
      enum: ['lost', 'found'],
      required: [true, 'Item type is required'],
    },
    itemTitle: {
      type: String,
      required: [true, 'Item title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    itemCategory: {
      type: String,
      required: [true, 'Item category is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    time: {
      type: Date,
      required: [true, 'Date & time is required'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    imagePublicId: {
      type: String,
      default: null,
    },
    hasOwner: {
      type: Boolean,
      default: false,
    },
    claimStatus: {
      type: String,
      enum: ['open', 'under_verification', 'claim_verified', 'claimed'],
      default: 'open',
    },
    ownerClaimId: {
      type: Schema.Types.ObjectId,
      ref: 'Claim',
      default: null,
    },
    needsOwnerReclaim: {
      type: Boolean,
      default: false,
      index: true,
    },
    claimableQueueStartedAt: {
      type: Date,
      default: null,
    },
    claimableQueueEndsAt: {
      type: Date,
      default: null,
      index: true,
    },
    claimableQueuePaused: {
      type: Boolean,
      default: false,
      index: true,
    },
    claimableQueueRemainingMs: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

export const Item = model<IItem>('Item', itemSchema);