import mongoose from 'mongoose';
import { Item } from '../models/item.model';
import { IItem } from '../models/item.model';
import { INotification, Notification } from '../models/Notification';

type AppError = Error & { statusCode?: number; isOperational?: boolean };

function createOperationalError(message: string, statusCode: number): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}

export async function createNotificationFromItem(item: IItem): Promise<INotification> {
  const notification = await Notification.findOneAndUpdate(
    { itemId: item._id },
    {
      $setOnInsert: {
        itemId: item._id,
        itemType: item.itemType,
        itemTitle: item.itemTitle,
        location: item.location,
        itemCreatedAt: item.createdAt,
        detectedAt: new Date(),
        isRead: false,
      },
    },
    { upsert: true, new: true }
  );

  return notification;
}

export async function backfillItemNotifications(limit = 500): Promise<number> {
  const items = await Item.find({}).sort({ createdAt: -1 }).limit(limit);
  let createdCount = 0;

  for (const item of items) {
    const updated = await Notification.findOneAndUpdate(
      { itemId: item._id },
      {
        $setOnInsert: {
          itemId: item._id,
          itemType: item.itemType,
          itemTitle: item.itemTitle,
          location: item.location,
          itemCreatedAt: item.createdAt,
          detectedAt: item.createdAt ?? new Date(),
          isRead: true,
          deletedAt: null,
        },
      },
      { upsert: true, new: true }
    );

    if (updated.createdAt.getTime() === updated.updatedAt.getTime()) {
      createdCount += 1;
    }
  }

  return createdCount;
}

export async function getNotifications(
  page = 1,
  limit = 100
): Promise<{ notifications: INotification[]; total: number }> {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(200, Math.max(1, limit));
  const skip = (safePage - 1) * safeLimit;
  const filter = { deletedAt: null };

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ detectedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    Notification.countDocuments(filter),
  ]);

  return { notifications, total };
}

export async function getUnreadCount(): Promise<number> {
  return Notification.countDocuments({ deletedAt: null, isRead: false });
}

export async function markAllNotificationsRead(): Promise<number> {
  const result = await Notification.updateMany(
    { deletedAt: null, isRead: false },
    { $set: { isRead: true } }
  );

  return result.modifiedCount;
}

export async function softDeleteNotification(id: string): Promise<INotification> {
  if (!mongoose.isValidObjectId(id)) {
    throw createOperationalError('Invalid notification id format.', 400);
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { deletedAt: new Date() } },
    { new: true }
  );

  if (!notification) {
    throw createOperationalError('Notification not found.', 404);
  }

  return notification;
}

export async function restoreNotification(id: string): Promise<INotification> {
  if (!mongoose.isValidObjectId(id)) {
    throw createOperationalError('Invalid notification id format.', 400);
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: id, deletedAt: { $ne: null } },
    { $set: { deletedAt: null } },
    { new: true }
  );

  if (!notification) {
    throw createOperationalError('Notification not found or not deleted.', 404);
  }

  return notification;
}
