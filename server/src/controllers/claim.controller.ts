import { Request, Response, NextFunction } from 'express';
import mongoose, { Types } from 'mongoose';
import { Claim, IClaim } from '../models/Claim';
import { Item, IItem } from '../models/item.model';

type ClaimAlert = {
  type: 'verification_started' | 'meeting_scheduled';
  message: string;
  createdAt: Date;
};

type ClaimLean = {
  _id: Types.ObjectId;
  itemId: IItem;
  claimantName: string;
  claimantEmail: string;
  claimantContactNumber: string;
  serialNumber: string;
  lostPlace: string;
  verificationId: string;
  verificationEndsAt: Date;
  meetingLocation?: string | null;
  meetingDateTime?: Date | null;
  status: IClaim['status'];
  alerts: ClaimAlert[];
};

function createError(message: string, statusCode: number): Error & { statusCode: number; isOperational: boolean } {
  const err = new Error(message) as Error & { statusCode: number; isOperational: boolean };
  err.statusCode = statusCode;
  err.isOperational = true;
  return err;
}

function createVerificationId(): string {
  const now = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `VC-${now}-${random}`;
}

function normalizeClaim(claim: ClaimLean, claimerCountByItem: Map<string, number>) {
  const now = Date.now();
  const item = claim.itemId;

  return {
    ...claim,
    claimerCount: claimerCountByItem.get(String(item._id)) ?? 1,
    countdownRemainingMs: Math.max(new Date(claim.verificationEndsAt).getTime() - now, 0),
  };
}

async function getClaimerCountByItem(itemIds: string[]): Promise<Map<string, number>> {
  if (itemIds.length === 0) return new Map();

  const counts = await Claim.aggregate<{ _id: Types.ObjectId; count: number }>([
    {
      $match: {
        itemId: { $in: itemIds.map((id) => new Types.ObjectId(id)) },
        status: { $ne: 'rejected' },
      },
    },
    {
      $group: {
        _id: '$itemId',
        count: { $sum: 1 },
      },
    },
  ]);

  return new Map(counts.map((entry) => [String(entry._id), entry.count]));
}

// ─── Claim Controller ─────────────────────────────────────────────────────────
// Owner: Lithira | Handles 48-hour holding & verification logic

export const getAllClaims = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const itemId = typeof req.query.itemId === 'string' ? req.query.itemId : undefined;

    const filter: Record<string, unknown> = {};

    if (status) {
      filter.status = status;
    }

    if (itemId) {
      if (!mongoose.isValidObjectId(itemId)) {
        throw createError('Invalid item id format.', 400);
      }
      filter.itemId = itemId;
    }

    const claims = (await Claim.find(filter)
      .populate('itemId')
      .sort({ createdAt: -1 })
      .lean()) as unknown as ClaimLean[];

    const itemIds = claims.map((claim) => String(claim.itemId._id));
    const claimerCountByItem = await getClaimerCountByItem(itemIds);

    res.json({
      claims: claims.map((claim) => normalizeClaim(claim, claimerCountByItem)),
    });
  } catch (err) {
    next(err);
  }
};

export const getClaimById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      throw createError('Invalid claim id format.', 400);
    }

    const claim = (await Claim.findById(id).populate('itemId').lean()) as ClaimLean | null;

    if (!claim) {
      throw createError('Claim not found.', 404);
    }

    const itemId = String(claim.itemId._id);
    const claimerCountByItem = await getClaimerCountByItem([itemId]);

    res.json({ claim: normalizeClaim(claim, claimerCountByItem) });
  } catch (err) {
    next(err);
  }
};

export const createClaim = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      itemId,
      claimantName,
      claimantEmail,
      claimantContactNumber,
      ownershipPassword,
      serialNumber,
      lostPlace,
    } = req.body as Record<string, string>;

    const requiredFields = [
      'itemId',
      'claimantName',
      'claimantEmail',
      'claimantContactNumber',
      'ownershipPassword',
      'serialNumber',
      'lostPlace',
    ] as const;

    for (const field of requiredFields) {
      if (!req.body[field]) {
        throw createError(`${field} is required.`, 400);
      }
    }

    if (!mongoose.isValidObjectId(itemId)) {
      throw createError('Invalid item id format.', 400);
    }

    const item = await Item.findById(itemId);
    if (!item) {
      throw createError('Item not found.', 404);
    }

    if (item.hasOwner) {
      throw createError('This item already has a verified owner.', 409);
    }

    const existingClaim = await Claim.findOne({
      itemId,
      claimantEmail: claimantEmail.toLowerCase(),
      status: { $in: ['pending_verification', 'claim_verified', 'approved'] },
    });

    if (existingClaim) {
      throw createError('You already submitted a claim for this item.', 409);
    }

    const verificationStartedAt = new Date();
    const verificationEndsAt = new Date(verificationStartedAt.getTime() + 48 * 60 * 60 * 1000);
    const verificationId = createVerificationId();

    const claim = await Claim.create({
      itemId,
      claimantName,
      claimantEmail,
      claimantContactNumber,
      ownershipPassword,
      serialNumber,
      lostPlace,
      verificationId,
      verificationStartedAt,
      verificationEndsAt,
      status: 'pending_verification',
      alerts: [
        {
          type: 'verification_started',
          message: `Your claim is in verification. Verification ID: ${verificationId}. Countdown: 48 hours.`,
          createdAt: verificationStartedAt,
        },
      ],
    });

    if (item.claimStatus === 'open') {
      item.claimStatus = 'under_verification';
    }

    item.needsOwnerReclaim = false;
    item.claimableQueueStartedAt = verificationStartedAt;
    item.claimableQueueEndsAt = verificationEndsAt;
    item.claimableQueuePaused = false;
    item.claimableQueueRemainingMs = null;
    await item.save();

    res.status(201).json({
      message: 'Claim submitted. Verification countdown started for 48 hours.',
      claim,
    });
  } catch (err) {
    next(err);
  }
};

export const verifyClaim = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { meetingLocation, meetingDateTime, broadcastToAllClaimers } = req.body as {
      meetingLocation?: string;
      meetingDateTime?: string;
      broadcastToAllClaimers?: boolean;
    };

    if (!mongoose.isValidObjectId(id)) {
      throw createError('Invalid claim id format.', 400);
    }

    if (!meetingLocation || !meetingDateTime) {
      throw createError('meetingLocation and meetingDateTime are required.', 400);
    }

    const claim = await Claim.findById(id);
    if (!claim) {
      throw createError('Claim not found.', 404);
    }

    if (claim.status !== 'pending_verification') {
      throw createError('Only pending claims can be marked as claim verified.', 400);
    }

    if (Date.now() < claim.verificationEndsAt.getTime()) {
      throw createError('Countdown is still active. You can schedule collection after 48 hours.', 400);
    }

    const parsedMeetingDate = new Date(meetingDateTime);
    if (Number.isNaN(parsedMeetingDate.getTime())) {
      throw createError('Invalid meetingDateTime.', 400);
    }

    const shouldBroadcast = broadcastToAllClaimers !== false;
    const targetClaims = shouldBroadcast
      ? await Claim.find({
          itemId: claim.itemId,
          status: { $in: ['pending_verification', 'claim_verified'] },
        })
      : [claim];

    if (targetClaims.length === 0) {
      throw createError('No active claimers found for this item.', 404);
    }

    const alertCreatedAt = new Date();
    for (const targetClaim of targetClaims) {
      targetClaim.status = 'claim_verified';
      targetClaim.meetingLocation = meetingLocation;
      targetClaim.meetingDateTime = parsedMeetingDate;
      targetClaim.alerts.push({
        type: 'meeting_scheduled',
        message: `Meeting scheduled at ${meetingLocation} on ${parsedMeetingDate.toLocaleString()}. Verification ID: ${targetClaim.verificationId}.`,
        createdAt: alertCreatedAt,
      });
    }

    await Promise.all(targetClaims.map((targetClaim) => targetClaim.save()));

    await Item.findByIdAndUpdate(claim.itemId, {
      claimStatus: 'claim_verified',
      needsOwnerReclaim: false,
      claimableQueueStartedAt: null,
      claimableQueueEndsAt: null,
      claimableQueuePaused: false,
      claimableQueueRemainingMs: null,
    });

    res.json({
      message: shouldBroadcast
        ? 'Claim moved to claim verified category and meeting details sent to all active claimers.'
        : 'Claim moved to claim verified category and meeting details sent to claimant.',
      updatedClaimsCount: targetClaims.length,
      claims: targetClaims,
    });
  } catch (err) {
    next(err);
  }
};

export const resolveClaim = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { decision } = req.body as { decision?: 'approve' | 'reject' };

    if (!mongoose.isValidObjectId(id)) {
      throw createError('Invalid claim id format.', 400);
    }

    if (!decision || !['approve', 'reject'].includes(decision)) {
      throw createError('decision must be "approve" or "reject".', 400);
    }

    const claim = await Claim.findById(id);
    if (!claim) {
      throw createError('Claim not found.', 404);
    }

    const item = await Item.findById(claim.itemId);
    if (!item) {
      throw createError('Linked item not found.', 404);
    }

    if (decision === 'approve') {
      claim.status = 'approved';
      item.hasOwner = true;
      item.ownerClaimId = claim._id as Types.ObjectId;
      item.claimStatus = 'claimed';
      item.needsOwnerReclaim = false;
      item.claimableQueueStartedAt = null;
      item.claimableQueueEndsAt = null;
      item.claimableQueuePaused = false;
      item.claimableQueueRemainingMs = null;
    } else {
      claim.status = 'rejected';

      const activeClaims = await Claim.countDocuments({
        itemId: claim.itemId,
        status: { $in: ['pending_verification', 'claim_verified', 'approved'] },
      });

      if (activeClaims <= 1) {
        item.claimStatus = 'open';
        item.needsOwnerReclaim = true;
        item.claimableQueueStartedAt = null;
        item.claimableQueueEndsAt = null;
        item.claimableQueuePaused = false;
        item.claimableQueueRemainingMs = null;
      }
    }

    await Promise.all([claim.save(), item.save()]);

    res.json({
      message: decision === 'approve' ? 'Claim approved and item assigned.' : 'Claim rejected.',
      claim,
      item,
    });
  } catch (err) {
    next(err);
  }
};

export const getClaimAlertsByEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.params;

    if (!email || !email.includes('@')) {
      throw createError('A valid email is required.', 400);
    }

    const claims = (await Claim.find({ claimantEmail: email.toLowerCase() })
      .populate('itemId')
      .sort({ createdAt: -1 })
      .lean()) as unknown as ClaimLean[];

    const alerts = claims.flatMap((claim) =>
      claim.alerts.map((alert) => ({
        claimId: claim._id,
        verificationId: claim.verificationId,
        status: claim.status,
        alertType: alert.type,
        message: alert.message,
        alertCreatedAt: alert.createdAt,
        countdownEndsAt: claim.verificationEndsAt,
        meetingLocation: claim.meetingLocation,
        meetingDateTime: claim.meetingDateTime,
        itemTitle: claim.itemId.itemTitle,
      }))
    );

    alerts.sort(
      (a, b) => new Date(b.alertCreatedAt).getTime() - new Date(a.alertCreatedAt).getTime()
    );

    res.json({ claims, alerts });
  } catch (err) {
    next(err);
  }
};
