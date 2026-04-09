import { Request, Response, NextFunction } from 'express';
import * as messageService from '../services/message.service';

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
  };
};

// ─── Message Controller ──────────────────────────────────────────────────────
// The controller now reads user identity from req.user.id, which is set by
// JWT middleware after verifying Authorization: Bearer <token>.

/** Helper: read the current user ID from the request */
function getUserId(req: Request): string | null {
  return (req as AuthenticatedRequest).user?.id ?? null;
}

/**
 * POST /api/messages/send
 * Body: { itemId, receiverId, text }
 */
export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const senderId = getUserId(req);
    if (!senderId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { itemId, receiverId, text } = req.body;

    if (!itemId || !receiverId || !text?.trim()) {
      res.status(400).json({ error: 'itemId, receiverId, and text are required' });
      return;
    }

    if (senderId === receiverId) {
      res.status(400).json({ error: 'Cannot message yourself' });
      return;
    }

    const conversation = await messageService.sendMessage(
      senderId,
      receiverId,
      itemId,
      text.trim()
    );

    res.status(201).json(conversation);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/messages/:itemId
 * Returns the conversation for a specific item that involves the current user.
 */
export const getMessagesByItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const senderId = getUserId(req);
    if (!senderId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { itemId } = req.params;
    const conversation = await messageService.getConversationByItem(itemId, senderId);

    res.json(conversation ?? { messages: [], participants: [] });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/conversations
 * Returns all conversations for the current user.
 */
export const getConversations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const conversations = await messageService.getUserConversations(userId);
    res.json(conversations);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/conversations/:conversationId
 * Returns a single conversation by ID.
 */
export const getConversationById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const conversation = await messageService.getConversationById(
      req.params.conversationId,
      userId
    );

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    res.json(conversation);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/conversations/:conversationId
 * Deletes a conversation (only if the requester is a participant).
 */
export const deleteConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const deleted = await messageService.deleteConversation(
      req.params.conversationId,
      userId
    );

    if (!deleted) {
      res.status(404).json({ error: 'Conversation not found or not authorized' });
      return;
    }

    res.json({ message: 'Conversation deleted' });
  } catch (err) {
    next(err);
  }
};
