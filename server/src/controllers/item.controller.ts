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

    const item = await itemService.createItem({
      itemType,
      itemTitle,
      itemCategory,
      description,
      time,
      location,
      contactNumber,
      imageBuffer,
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

// POST /api/items/:id/queue-claimable
export async function queueClaimableItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const item = await itemService.queueItemForClaimVerification(req.params.id);

    res.json({
      message: 'Item moved to pending verification queue for 48 hours.',
      item,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/items/:id/stop-queue
export async function stopQueuedClaimableItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const item = await itemService.stopClaimableQueue(req.params.id);

    res.json({
      message: 'Countdown stopped for this item.',
      item,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/items/:id/pause-queue
export async function pauseQueuedClaimableItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const item = await itemService.pauseClaimableQueue(req.params.id);

    res.json({
      message: 'Countdown paused for this item.',
      item,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/items/:id/resume-queue
export async function resumeQueuedClaimableItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const item = await itemService.resumeClaimableQueue(req.params.id);

    res.json({
      message: 'Countdown resumed for this item.',
      item,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/items/:id/send-reclaim
export async function sendQueuedItemToReclaim(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const item = await itemService.sendQueuedItemToReclaim(req.params.id);

    res.json({
      message: 'Item moved to reclaim list.',
      item,
    });
  } catch (err) {
    next(err);
  }
}