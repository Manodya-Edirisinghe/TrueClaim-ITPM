import mongoose from 'mongoose';
import { Item, IItem } from '../models/item.model';
import { Claim } from '../models/Claim';
import {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
} from '../utils/cloudinary.util';
import { createNotificationFromItem } from './notification.service';

const VALID_TYPES = ['lost', 'found'] as const;
type ItemType = (typeof VALID_TYPES)[number];

export interface CreateItemDTO {
  itemType: string;
  itemTitle: string;
  itemCategory: string;
  description: string;
  time: string;
  location: string;
  contactNumber: string;
  imageBuffer?: Buffer;
}

function validatePayload(dto: CreateItemDTO): void {
  if (!VALID_TYPES.includes(dto.itemType as ItemType)) {
    const err: Error & { statusCode?: number; isOperational?: boolean } =
      new Error('Invalid item type. Must be "lost" or "found".');
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }

  const required: (keyof CreateItemDTO)[] = [
    'itemType',
    'itemTitle',
    'itemCategory',
    'description',
    'time',
    'location',
    'contactNumber',
  ];

  for (const field of required) {
    if (!dto[field]) {
      const err: Error & { statusCode?: number; isOperational?: boolean } =
        new Error(`${field} is required.`);
      err.statusCode = 400;
      err.isOperational = true;
      throw err;
    }
  }

  if (isNaN(Date.parse(dto.time))) {
    const err: Error & { statusCode?: number; isOperational?: boolean } =
      new Error('Invalid date/time format.');
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }
}

export async function createItem(dto: CreateItemDTO): Promise<IItem> {
  validatePayload(dto);

  let imageUrl: string | undefined;
  let imagePublicId: string | undefined;

  if (dto.imageBuffer) {
    const uploaded = await uploadImageToCloudinary(dto.imageBuffer);
    imageUrl = uploaded.url;
    imagePublicId = uploaded.publicId;
  }

  const item = await Item.create({
    itemType: dto.itemType,
    itemTitle: dto.itemTitle,
    itemCategory: dto.itemCategory,
    description: dto.description,
    time: new Date(dto.time),
    location: dto.location,
    contactNumber: dto.contactNumber,
    imageUrl,
    imagePublicId,
  });

  try {
    await createNotificationFromItem(item);
  } catch (error) {
    console.error('[Notification] Failed to create notification from item:', error);
  }

  return item;
}

export async function getAllItems(
  type?: string,
  page = 1,
  limit = 20
): Promise<{ items: IItem[]; total: number }> {
  const filter = type && VALID_TYPES.includes(type as ItemType) ? { itemType: type } : {};
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Item.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Item.countDocuments(filter),
  ]);

  return { items, total };
}

export async function getItemById(id: string): Promise<IItem | null> {
  return Item.findById(id);
}

export async function deleteItem(id: string): Promise<boolean> {
  if (!mongoose.isValidObjectId(id)) {
    const err: Error & { statusCode?: number; isOperational?: boolean } =
      new Error('Invalid item id format.');
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }

  const item = await Item.findById(id);
  if (!item) return false;

  if (item.imagePublicId) {
    try {
      await deleteImageFromCloudinary(item.imagePublicId);
    } catch {
      const err: Error & { statusCode?: number; isOperational?: boolean } =
        new Error('Failed to remove image from Cloudinary. Please try again.');
      err.statusCode = 502;
      err.isOperational = true;
      throw err;
    }
  }

  await item.deleteOne();
  return true;
}

export async function queueItemForClaimVerification(id: string): Promise<IItem> {
  if (!mongoose.isValidObjectId(id)) {
    const err: Error & { statusCode?: number; isOperational?: boolean } =
      new Error('Invalid item id format.');
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }

  const item = await Item.findById(id);
  if (!item) {
    const err: Error & { statusCode?: number; isOperational?: boolean } =
      new Error('Item not found.');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  if (item.hasOwner || item.claimStatus === 'claimed') {
    const err: Error & { statusCode?: number; isOperational?: boolean } =
      new Error('Claimed items cannot be moved to pending verification queue.');
    err.statusCode = 409;
    err.isOperational = true;
    throw err;
  }

  const startedAt = new Date();
  const endsAt = new Date(startedAt.getTime() + 48 * 60 * 60 * 1000);

  item.claimStatus = 'under_verification';
  item.needsOwnerReclaim = false;
  item.claimableQueueStartedAt = startedAt;
  item.claimableQueueEndsAt = endsAt;
  item.claimableQueuePaused = false;
  item.claimableQueueRemainingMs = null;

  await item.save();
  return item;
}

export async function releaseExpiredClaimableQueueItems(): Promise<number> {
  const now = new Date();

  const expiredQueuedItems = await Item.find({
    claimStatus: 'under_verification',
    claimableQueueEndsAt: { $lte: now },
    claimableQueuePaused: false,
    hasOwner: false,
  });

  if (expiredQueuedItems.length === 0) return 0;

  let releasedCount = 0;

  for (const item of expiredQueuedItems) {
    const activeClaimsCount = await Claim.countDocuments({
      itemId: item._id,
      status: { $in: ['pending_verification', 'claim_verified', 'approved'] },
    });

    if (activeClaimsCount === 0) {
      item.claimStatus = 'open';
      item.needsOwnerReclaim = true;
    }

    item.claimableQueueStartedAt = null;
    item.claimableQueueEndsAt = null;
    item.claimableQueuePaused = false;
    item.claimableQueueRemainingMs = null;
    await item.save();
    releasedCount += 1;
  }

  return releasedCount;
}

export async function stopClaimableQueue(id: string): Promise<IItem> {
  if (!mongoose.isValidObjectId(id)) {
    const err: Error & { statusCode?: number; isOperational?: boolean } =
      new Error('Invalid item id format.');
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }

  const item = await Item.findById(id);
  if (!item) {
    const err: Error & { statusCode?: number; isOperational?: boolean } =
      new Error('Item not found.');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  if (item.hasOwner || item.claimStatus === 'claimed') {
    const err: Error & { statusCode?: number; isOperational?: boolean } =
      new Error('This item already has an approved owner and cannot be moved to reclaim list.');
    err.statusCode = 409;
    err.isOperational = true;
    throw err;
  }

  item.claimStatus = 'under_verification';
  item.needsOwnerReclaim = false;
  item.claimableQueueStartedAt = null;
  item.claimableQueueEndsAt = null;
  item.claimableQueuePaused = false;
  item.claimableQueueRemainingMs = null;

  await item.save();
  return item;
}

// Backward-compatible alias for older controller references.
export async function stopClaimableQueueAndSendToReclaim(id: string): Promise<IItem> {
  return stopClaimableQueue(id);
}

export async function pauseClaimableQueue(id: string): Promise<IItem> {
  if (!mongoose.isValidObjectId(id)) {
    const err: Error & { statusCode?: number; isOperational?: boolean } =
      new Error('Invalid item id format.');
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }

  const item = await Item.findById(id);
  if (!item) {
    const err: Error & { statusCode?: number; isOperational?: boolean } =
      new Error('Item not found.');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  if (item.hasOwner || item.claimStatus === 'claimed') {
    const err: Error & { statusCode?: number; isOperational?: boolean } =
      new Error('This item already has an approved owner and cannot be paused.');
    err.statusCode = 409;
    err.isOperational = true;
    throw err;
  }

  if (item.claimableQueuePaused) {
    return item;
  }

  if (!item.claimableQueueEndsAt) {
    const err: Error & { statusCode?: number; isOperational?: boolean } =
      new Error('This item is not currently running in manual queue countdown.');
    err.statusCode = 409;
    err.isOperational = true;
    throw err;
  }

  const remainingMs = Math.max(item.claimableQueueEndsAt.getTime() - Date.now(), 0);
  item.claimableQueuePaused = true;
  item.claimableQueueRemainingMs = remainingMs;
  item.claimableQueueEndsAt = null;
  await item.save();
  return item;
}

export async function resumeClaimableQueue(id: string): Promise<IItem> {
  if (!mongoose.isValidObjectId(id)) {
    const err: Error & { statusCode?: number; isOperational?: boolean } =
      new Error('Invalid item id format.');
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }

  const item = await Item.findById(id);
  if (!item) {
    const err: Error & { statusCode?: number; isOperational?: boolean } =
      new Error('Item not found.');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  if (item.hasOwner || item.claimStatus === 'claimed') {
    const err: Error & { statusCode?: number; isOperational?: boolean } =
      new Error('This item already has an approved owner and cannot be resumed.');
    err.statusCode = 409;
    err.isOperational = true;
    throw err;
  }

  if (!item.claimableQueuePaused) {
    const err: Error & { statusCode?: number; isOperational?: boolean } =
      new Error('This item is not paused.');
    err.statusCode = 409;
    err.isOperational = true;
    throw err;
  }

  const remainingMs = Math.max(item.claimableQueueRemainingMs ?? 0, 0);
  if (remainingMs === 0) {
    const err: Error & { statusCode?: number; isOperational?: boolean } =
      new Error('No remaining countdown time available to resume.');
    err.statusCode = 409;
    err.isOperational = true;
    throw err;
  }

  const startedAt = new Date();
  item.claimableQueueStartedAt = startedAt;
  item.claimableQueueEndsAt = new Date(startedAt.getTime() + remainingMs);
  item.claimableQueuePaused = false;
  item.claimableQueueRemainingMs = null;
  item.claimStatus = 'under_verification';
  item.needsOwnerReclaim = false;

  await item.save();
  return item;
}

export async function sendQueuedItemToReclaim(id: string): Promise<IItem> {
  if (!mongoose.isValidObjectId(id)) {
    const err: Error & { statusCode?: number; isOperational?: boolean } =
      new Error('Invalid item id format.');
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }

  const item = await Item.findById(id);
  if (!item) {
    const err: Error & { statusCode?: number; isOperational?: boolean } =
      new Error('Item not found.');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  if (item.hasOwner || item.claimStatus === 'claimed') {
    const err: Error & { statusCode?: number; isOperational?: boolean } =
      new Error('This item already has an approved owner and cannot be moved to reclaim list.');
    err.statusCode = 409;
    err.isOperational = true;
    throw err;
  }

  item.claimStatus = 'open';
  item.needsOwnerReclaim = true;
  item.claimableQueueStartedAt = null;
  item.claimableQueueEndsAt = null;
  item.claimableQueuePaused = false;
  item.claimableQueueRemainingMs = null;

  await item.save();
  return item;
}