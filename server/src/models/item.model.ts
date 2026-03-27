import { Schema, model, Document } from 'mongoose';

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
  // Who submitted this item — used for messaging.
  // FUTURE UPGRADE: Replace with real auth user ID.
  ownerId?: string;
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
    ownerId: {
      type: String,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

export const Item = model<IItem>('Item', itemSchema);