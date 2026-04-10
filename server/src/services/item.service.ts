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
  imageUrl?: string;
  imagePublicId?: string;
  ownerId?: string;
}

export interface UpdateItemDTO {
  itemTitle: string;
  itemCategory: string;
  description: string;
  time: string;
  location: string;
  contactNumber: string;
  imageUrl?: string;
  imagePublicId?: string;
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

  const item = await Item.create({
    itemType: dto.itemType,
    itemTitle: dto.itemTitle,
    itemCategory: dto.itemCategory,
    description: dto.description,
    time: new Date(dto.time),
    location: dto.location,
    contactNumber: dto.contactNumber,
    imageUrl: dto.imageUrl,
    imagePublicId: dto.imagePublicId,
    ownerId: dto.ownerId,
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

function validateUpdatePayload(dto: UpdateItemDTO): void {
  const required: (keyof UpdateItemDTO)[] = [
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

export async function getItemById(id: string): Promise<IItem | null> {
  return Item.findById(id);
}

export async function updateItem(id: string, dto: UpdateItemDTO): Promise<IItem | null> {
  validateUpdatePayload(dto);

  const item = await Item.findById(id);
  if (!item) return null;

  if (dto.imageUrl) {
    item.imageUrl = dto.imageUrl;
    item.imagePublicId = dto.imagePublicId;
  }

  item.itemTitle = dto.itemTitle;
  item.itemCategory = dto.itemCategory;
  item.description = dto.description;
  item.time = new Date(dto.time);
  item.location = dto.location;
  item.contactNumber = dto.contactNumber;

  await item.save();
  return item;
}

export async function deleteItem(id: string): Promise<boolean> {
  const item = await Item.findById(id);
  if (!item) return false;

  await item.deleteOne();
  return true;
}