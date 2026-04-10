import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
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
router.post('/send', requireAuth, sendMessage);
router.get('/:itemId', requireAuth, getMessagesByItem);

export default router;

// Conversation routes (mounted separately in server.ts)
export const conversationRouter = Router();
conversationRouter.get('/', requireAuth, getConversations);
conversationRouter.get('/:conversationId', requireAuth, getConversationById);
conversationRouter.delete('/:conversationId', requireAuth, deleteConversation);
