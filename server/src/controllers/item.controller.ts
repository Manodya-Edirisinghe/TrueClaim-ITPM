import { Request, Response, NextFunction } from 'express';
import * as itemService from '../services/item.service';

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

// DELETE /api/items/:id
export async function deleteItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
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