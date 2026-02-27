import { Router } from 'express';
import {
  getMessagesByRoom,
  sendMessage,
  getMatchedItems,
} from '../controllers/message.controller';

// ─── Message Routes ───────────────────────────────────────────────────────────
// Owner: Manodya | Base: /api/messages

const router = Router();

router.get('/room/:roomId', getMessagesByRoom);
router.post('/send', sendMessage);
router.get('/matches/:itemId', getMatchedItems);

export default router;
