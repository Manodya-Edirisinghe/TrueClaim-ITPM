import { NextFunction, Request, Response } from 'express';
import * as notificationService from '../services/notification.service';

export async function getNotifications(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10));
    const limit = Math.min(200, Math.max(1, parseInt((req.query.limit as string) ?? '100', 10)));

    await notificationService.backfillItemNotifications();

    const [result, unreadCount] = await Promise.all([
      notificationService.getNotifications(page, limit),
      notificationService.getUnreadCount(),
    ]);

    res.json({
      notifications: result.notifications,
      unreadCount,
      meta: {
        total: result.total,
        page,
        limit,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function markAllNotificationsRead(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const updated = await notificationService.markAllNotificationsRead();
    res.json({ message: 'All notifications marked as read.', updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteNotification(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const notification = await notificationService.softDeleteNotification(req.params.id);
    res.json({ message: 'Notification deleted.', notification });
  } catch (err) {
    next(err);
  }
}

export async function restoreNotification(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const notification = await notificationService.restoreNotification(req.params.id);
    res.json({ message: 'Notification restored.', notification });
  } catch (err) {
    next(err);
  }
}
