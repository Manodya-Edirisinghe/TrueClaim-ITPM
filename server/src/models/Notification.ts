import { Document, Schema, Types, model } from 'mongoose';

export interface INotification extends Document {
  itemId?: Types.ObjectId | null;
  itemType: 'lost' | 'found';
  itemTitle: string;
  location: string;
  itemCreatedAt?: Date | null;
  detectedAt: Date;
  isRead: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    itemId: {
      type: Schema.Types.ObjectId,
      ref: 'Item',
      default: null,
      index: true,
    },
    itemType: {
      type: String,
      enum: ['lost', 'found'],
      required: true,
    },
    itemTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    itemCreatedAt: {
      type: Date,
      default: null,
    },
    detectedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ deletedAt: 1, detectedAt: -1 });

export const Notification = model<INotification>('Notification', notificationSchema);
