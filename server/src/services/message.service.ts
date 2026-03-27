import Conversation, { IConversation } from '../models/conversation.model';

// ─── Message Service ─────────────────────────────────────────────────────────
// Pure business logic — no Express req/res here.
// senderId / receiverId are generic strings so this layer is auth-agnostic.
// FUTURE UPGRADE: When real auth is added, just pass the real userId instead
// of the temporary localStorage ID. Nothing else changes here.

/**
 * Send a message within a conversation (creates the conversation if needed).
 */
export async function sendMessage(
  senderId: string,
  receiverId: string,
  itemId: string,
  text: string
): Promise<IConversation> {
  // Sort participants so the same pair always produces the same order
  const participants = [senderId, receiverId].sort() as [string, string];

  // Upsert: find existing conversation or create a new one
  const conversation = await Conversation.findOneAndUpdate(
    { itemId, participants },
    {
      $push: { messages: { senderId, text } },
      $set: { lastMessageAt: new Date() },
      $setOnInsert: { itemId, participants },
    },
    { new: true, upsert: true }
  );

  return conversation;
}

/**
 * Get the conversation for a specific item that involves the current user.
 */
export async function getConversationByItem(
  itemId: string,
  userId: string
): Promise<IConversation | null> {
  return Conversation.findOne({
    itemId,
    participants: userId,
  });
}

/**
 * Get all conversations the current user is part of, sorted by most recent.
 */
export async function getUserConversations(
  userId: string
) {
  return Conversation.find({ participants: userId })
    .sort({ lastMessageAt: -1 })
    .lean();
}

/**
 * Get a single conversation by its ID (with participant check).
 */
export async function getConversationById(
  conversationId: string,
  userId: string
): Promise<IConversation | null> {
  return Conversation.findOne({
    _id: conversationId,
    participants: userId,
  });
}

/**
 * Delete a conversation. Only a participant can delete it.
 */
export async function deleteConversation(
  conversationId: string,
  userId: string
): Promise<boolean> {
  const result = await Conversation.findOneAndDelete({
    _id: conversationId,
    participants: userId,
  });
  return result !== null;
}
