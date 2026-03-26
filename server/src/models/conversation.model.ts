import mongoose, { Document, Schema } from 'mongoose';

// ─── Message Sub-document ────────────────────────────────────────────────────
// Each message lives inside a Conversation. senderId is a generic string
// so it works with temporary IDs now and real user IDs later.

export interface IMessage {
  senderId: string;
  text: string;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    senderId: { type: String, required: true },
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// ─── Conversation Document ───────────────────────────────────────────────────
// A conversation is uniquely identified by (itemId + sorted participants).
// This ensures only ONE conversation exists per item per pair of users.

export interface IConversation extends Document {
  itemId: string;
  participants: [string, string];
  messages: IMessage[];
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    itemId: { type: String, required: true, index: true },
    participants: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length === 2,
        message: 'A conversation must have exactly 2 participants',
      },
    },
    messages: { type: [messageSchema], default: [] },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index: fast lookup by participant + sort by recent activity
conversationSchema.index({ participants: 1, lastMessageAt: -1 });
// Ensure one conversation per item per pair of users
conversationSchema.index({ itemId: 1, participants: 1 });

const Conversation = mongoose.model<IConversation>(
  'Conversation',
  conversationSchema
);

export default Conversation;
