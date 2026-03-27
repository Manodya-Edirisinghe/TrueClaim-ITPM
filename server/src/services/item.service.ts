import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { Item, IItem } from '../models/item.model';

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
  originalName?: string;
  ownerId?: string;
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

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

async function saveImageLocally(
  buffer: Buffer,
  originalName?: string
): Promise<{ imageUrl: string; imagePublicId: string }> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });

  const ext = originalName
    ? path.extname(originalName)
    : '.jpg';
  const filename = `${crypto.randomUUID()}${ext}`;
  const filePath = path.join(UPLOADS_DIR, filename);

  await fs.writeFile(filePath, buffer);

  return {
    imageUrl: `/uploads/${filename}`,
    imagePublicId: filename,
  };
}

export async function createItem(dto: CreateItemDTO): Promise<IItem> {
  validatePayload(dto);

  let imageUrl: string | undefined;
  let imagePublicId: string | undefined;

  if (dto.imageBuffer) {
    const saved = await saveImageLocally(dto.imageBuffer, dto.originalName);
    imageUrl = saved.imageUrl;
    imagePublicId = saved.imagePublicId;
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
    ownerId: dto.ownerId ?? null,
  });

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
  const item = await Item.findById(id);
  if (!item) return false;

  if (item.imagePublicId) {
    try {
      await fs.unlink(path.join(UPLOADS_DIR, item.imagePublicId));
    } catch {
      // Ignore if file already removed from disk.
    }
  }

  await item.deleteOne();
  return true;
}