import { Router } from 'express';
import {
  sendMessage,
  getMessagesByItem,
  getConversations,
  getConversationById,
  deleteConversation,
} from '../controllers/message.controller';

// ─── Message Routes ──────────────────────────────────────────────────────────
// Base: /api/messages  &  /api/conversations

const router = Router();

// Messages
router.post('/send', sendMessage);
router.get('/:itemId', getMessagesByItem);

export default router;

// Conversation routes (mounted separately in server.ts)
export const conversationRouter = Router();
conversationRouter.get('/', getConversations);
conversationRouter.get('/:conversationId', getConversationById);
conversationRouter.delete('/:conversationId', deleteConversation);
