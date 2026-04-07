import { Router } from 'express';
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  restoreNotification,
} from '../controllers/notification.controller';

const router = Router();

router.get('/', getNotifications);
router.post('/read-all', markAllNotificationsRead);
router.delete('/:id', deleteNotification);
router.post('/:id/restore', restoreNotification);

export default router;
