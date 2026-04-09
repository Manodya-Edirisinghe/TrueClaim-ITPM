import { Request, Response, NextFunction } from 'express';
import * as itemService from '../services/item.service';

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
  };
};

function getAuthenticatedUserId(req: Request): string | undefined {
  return (req as AuthenticatedRequest).user?.id;
}

// POST /api/items
export async function createItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { itemType, itemTitle, itemCategory, description, time, location, contactNumber } =
      req.body;

    const imageBuffer = req.file?.buffer;
    const originalName = req.file?.originalname;
    const ownerId = getAuthenticatedUserId(req);

    const item = await itemService.createItem({
      itemType,
      itemTitle,
      itemCategory,
      description,
      time,
      location,
      contactNumber,
      imageBuffer,
      originalName,
      ownerId,
    });

    res.status(201).json({ message: 'Item submitted successfully', item });
  } catch (err) {
    next(err);
  }
}

// GET /api/items
export async function getItems(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const itemType = req.query.itemType as string | undefined;
    const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) ?? '20', 10)));

    const { items, total } = await itemService.getAllItems(itemType, page, limit);

    res.json({
      items,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/items/:id
export async function getItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const item = await itemService.getItemById(req.params.id);

    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    res.json({ item });
  } catch (err) {
    next(err);
  }
}

// PUT /api/items/:id
export async function updateItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const existingItem = await itemService.getItemById(req.params.id);
    if (!existingItem) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    if (!existingItem.ownerId || existingItem.ownerId !== userId) {
      res.status(403).json({ error: 'Forbidden: only the owner can update this item' });
      return;
    }

    const { itemTitle, itemCategory, description, time, location, contactNumber } = req.body;

    const imageBuffer = req.file?.buffer;
    const originalName = req.file?.originalname;

    const item = await itemService.updateItem(req.params.id, {
      itemTitle,
      itemCategory,
      description,
      time,
      location,
      contactNumber,
      imageBuffer,
      originalName,
    });

    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    res.json({ message: 'Item updated successfully', item });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/items/:id
export async function deleteItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const existingItem = await itemService.getItemById(req.params.id);
    if (!existingItem) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    if (!existingItem.ownerId || existingItem.ownerId !== userId) {
      res.status(403).json({ error: 'Forbidden: only the owner can delete this item' });
      return;
    }

    const deleted = await itemService.deleteItem(req.params.id);

    if (!deleted) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    next(err);
  }
}