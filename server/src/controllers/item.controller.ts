import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import * as itemService from '../services/item.service';
import { Claim } from '../models/Claim';
import { Item } from '../models/item.model';

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

    const imageUrl = req.file?.path;
    const ownerId = getAuthenticatedUserId(req);

    const item = await itemService.createItem({
      itemType,
      itemTitle,
      itemCategory,
      description,
      time,
      location,
      contactNumber,
      imageUrl,
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

    // Backward compatibility: older records may not have ownerId set.
    // Temporarily assign ownership to the authenticated user on first protected action.
    if (!existingItem.ownerId) {
      existingItem.ownerId = userId;
      await existingItem.save();
    }

    if (existingItem.ownerId !== userId) {
      res.status(403).json({ error: 'Forbidden: only the owner can update this item' });
      return;
    }

    const { itemTitle, itemCategory, description, time, location, contactNumber } = req.body;

    const imageUrl = req.file?.path;

    const item = await itemService.updateItem(req.params.id, {
      itemTitle,
      itemCategory,
      description,
      time,
      location,
      contactNumber,
      imageUrl,
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

    // Backward compatibility: older records may not have ownerId set.
    // Temporarily assign ownership to the authenticated user on first protected action.
    if (!existingItem.ownerId) {
      existingItem.ownerId = userId;
      await existingItem.save();
    }

    if (existingItem.ownerId !== userId) {
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

// POST /api/items/:id/queue-claimable
export async function queueClaimableItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    if (item.claimStatus === 'claimed') {
      res.status(400).json({ error: 'Claimed items cannot be queued.' });
      return;
    }

    if (item.claimStatus === 'under_verification' && (item.claimableQueueEndsAt || item.claimableQueuePaused)) {
      res.json({ message: 'Item is already in the 48-hour pending queue.', item });
      return;
    }

    const now = new Date();
    const queueEndsAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    item.claimStatus = 'under_verification';
    item.claimableQueueStartedAt = now;
    item.claimableQueueEndsAt = queueEndsAt;
    item.claimableQueuePaused = false;
    item.claimableQueueRemainingMs = null;

    await item.save();

    res.json({ message: 'Item added to 48-hour pending queue.', item });
  } catch (err) {
    next(err);
  }
}

// POST /api/items/:id/stop-queue
export async function stopClaimableQueue(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    item.claimStatus = 'open';
    item.claimableQueueStartedAt = null;
    item.claimableQueueEndsAt = null;
    item.claimableQueuePaused = false;
    item.claimableQueueRemainingMs = null;

    await item.save();
    res.json({ message: 'Queue stopped for this item.', item });
  } catch (err) {
    next(err);
  }
}

// POST /api/items/:id/pause-queue
export async function pauseClaimableQueue(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    if (item.claimableQueuePaused) {
      res.json({ message: 'Queue is already paused.', item });
      return;
    }

    if (!item.claimableQueueEndsAt) {
      res.status(400).json({ error: 'No active queue countdown found.' });
      return;
    }

    const remaining = Math.max(item.claimableQueueEndsAt.getTime() - Date.now(), 0);

    item.claimableQueuePaused = true;
    item.claimableQueueRemainingMs = remaining;
    item.claimableQueueEndsAt = null;

    await item.save();
    res.json({ message: 'Queue paused for this item.', item });
  } catch (err) {
    next(err);
  }
}

// POST /api/items/:id/resume-queue
export async function resumeClaimableQueue(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    if (!item.claimableQueuePaused) {
      res.status(400).json({ error: 'Queue is not paused for this item.' });
      return;
    }

    const remainingMs = Math.max(item.claimableQueueRemainingMs ?? 0, 0);
    if (!remainingMs) {
      res.status(400).json({ error: 'No remaining queue time available to resume.' });
      return;
    }

    item.claimableQueuePaused = false;
    item.claimableQueueEndsAt = new Date(Date.now() + remainingMs);
    item.claimableQueueRemainingMs = null;
    item.claimStatus = 'under_verification';

    await item.save();
    res.json({ message: 'Queue resumed for this item.', item });
  } catch (err) {
    next(err);
  }
}

// POST /api/items/:id/send-reclaim
export async function sendToReclaim(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    item.needsOwnerReclaim = true;
    item.claimStatus = 'open';
    item.claimableQueueStartedAt = null;
    item.claimableQueueEndsAt = null;
    item.claimableQueuePaused = false;
    item.claimableQueueRemainingMs = null;

    await item.save();
    res.json({ message: 'Item moved to reclaim list.', item });
  } catch (err) {
    next(err);
  }
}

// POST /api/items/:id/manual-approve
export async function manualApproveFromQueue(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    if (item.hasOwner && item.ownerClaimId) {
      res.status(400).json({ error: 'This item is already approved and linked to an owner claim.' });
      return;
    }

    let claim = await Claim.findOne({ itemId: item._id, status: { $in: ['claim_verified', 'approved'] } }).sort({ updatedAt: -1 });

    if (!claim) {
      const now = new Date();
      claim = await Claim.create({
        itemId: item._id,
        claimantName: 'Manual Approval',
        claimantEmail: `manual-approval-${item._id.toString()}@trueclaim.local`,
        claimantContactNumber: 'N/A',
        ownershipPassword: randomUUID(),
        serialNumber: 'N/A',
        lostPlace: item.location,
        verificationId: `MANUAL-${randomUUID().slice(0, 8).toUpperCase()}`,
        verificationStartedAt: now,
        verificationEndsAt: now,
        meetingLocation: 'Manual Approval',
        meetingDateTime: now,
        status: 'approved',
        alerts: [
          {
            type: 'claim_decision',
            message: 'Claim manually approved from queue.',
            createdAt: now,
          },
        ],
      });
    } else {
      claim.status = 'approved';
      claim.alerts.push({
        type: 'claim_decision',
        message: 'Claim manually approved from queue.',
        createdAt: new Date(),
      });
      await claim.save();
    }

    item.hasOwner = true;
    item.ownerClaimId = claim._id;
    item.claimStatus = 'claimed';
    item.needsOwnerReclaim = false;
    item.claimableQueueStartedAt = null;
    item.claimableQueueEndsAt = null;
    item.claimableQueuePaused = false;
    item.claimableQueueRemainingMs = null;

    await item.save();

    res.json({
      message: 'Item manually approved and added to Claims Hub approved list.',
      claim,
      item,
    });
  } catch (err) {
    next(err);
  }
}