import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import { Claim } from '../models/Claim';
import ClaimMeeting from '../models/ClaimMeeting';
import { Item } from '../models/item.model';

type PopulatedClaim = {
  _id: Types.ObjectId;
  verificationId: string;
  status: 'pending_verification' | 'claim_verified' | 'approved' | 'rejected';
  claimantName: string;
  claimantEmail: string;
  claimantContactNumber: string;
  serialNumber?: string;
  lostPlace?: string;
  uniqueQuestion: string;
  uniqueAnswer: string;
  verificationEndsAt: Date;
  meetingLocation?: string | null;
  meetingDateTime?: Date | null;
  itemId?: {
    _id: Types.ObjectId;
    itemTitle: string;
    itemCategory: string;
    location: string;
    claimStatus?: string;
  } | null;
};

function getSafeItem(claim: PopulatedClaim) {
  return (
    claim.itemId ?? {
      _id: new Types.ObjectId(),
      itemTitle: 'Deleted Item',
      itemCategory: 'Unknown',
      location: 'Unknown',
      claimStatus: 'open',
    }
  );
}

function toApiClaim(claim: PopulatedClaim, claimerCount: number) {
  const remaining = Math.max(new Date(claim.verificationEndsAt).getTime() - Date.now(), 0);
  const safeItem = getSafeItem(claim);

  return {
    _id: claim._id,
    verificationId: claim.verificationId,
    status: claim.status,
    claimantName: claim.claimantName,
    claimantEmail: claim.claimantEmail,
    claimantContactNumber: claim.claimantContactNumber,
    serialNumber: claim.serialNumber ?? '',
    lostPlace: claim.lostPlace ?? '',
    uniqueQuestion: claim.uniqueQuestion ?? 'No category question recorded.',
    uniqueAnswer: claim.uniqueAnswer ?? 'No answer submitted.',
    verificationEndsAt: claim.verificationEndsAt,
    countdownRemainingMs: remaining,
    claimerCount,
    meetingLocation: claim.meetingLocation ?? undefined,
    meetingDateTime: claim.meetingDateTime ?? undefined,
    itemId: safeItem,
  };
}

// ─── Claim Controller ─────────────────────────────────────────────────────────
// Owner: Lithira | Handles 48-hour holding & verification logic

export const getAllClaims = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const claims = (await Claim.find({})
      .sort({ createdAt: -1 })
      .populate('itemId', 'itemTitle itemCategory location claimStatus')
      .lean()) as unknown as PopulatedClaim[];

    const claimerCountByItemId = claims.reduce<Record<string, number>>((acc, claim) => {
      const key = String(getSafeItem(claim)._id);
      if (!key) return acc;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    res.json({
      claims: claims.map((claim) =>
        toApiClaim(claim, claimerCountByItemId[String(getSafeItem(claim)._id)] ?? 1)
      ),
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
    const claim = (await Claim.findById(req.params.id)
      .populate('itemId', 'itemTitle itemCategory location claimStatus')
      .lean()) as unknown as PopulatedClaim | null;

    if (!claim) {
      res.status(404).json({ error: 'Claim not found' });
      return;
    }

    const claimerCount = await Claim.countDocuments({ itemId: getSafeItem(claim)._id });
    res.json({ claim: toApiClaim(claim, Math.max(claimerCount, 1)) });
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
      uniqueQuestion,
      uniqueAnswer,
      ownershipPassword,
      serialNumber,
      lostPlace,
    } = req.body;

    if (
      !itemId ||
      !claimantName ||
      !claimantEmail ||
      !claimantContactNumber ||
      !uniqueQuestion ||
      !uniqueAnswer
    ) {
      res.status(400).json({ error: 'Missing required claim fields.' });
      return;
    }

    const now = new Date();
    const verificationEndsAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const claim = await Claim.create({
      itemId,
      claimantName,
      claimantEmail,
      claimantContactNumber,
      uniqueQuestion,
      uniqueAnswer,
      ownershipPassword: ownershipPassword ?? '',
      serialNumber: serialNumber ?? '',
      lostPlace: lostPlace ?? '',
      verificationId: `VERIFY-${randomUUID().slice(0, 8).toUpperCase()}`,
      verificationStartedAt: now,
      verificationEndsAt,
      status: 'pending_verification',
      alerts: [
        {
          type: 'verification_started',
          message: 'Verification window started.',
          createdAt: now,
        },
      ],
    });

    res.status(201).json({ message: 'Claim created successfully.', claim });
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
    const {
      meetingLocation,
      meetingDateTime,
      meetingDateTimeLocal,
      meetingTimeZone,
      meetingUtcOffsetMinutes,
      broadcastToAllClaimers,
    } = req.body;

    if (!meetingLocation || !meetingDateTime) {
      res.status(400).json({ error: 'Meeting location and date/time are required.' });
      return;
    }

    const claim = await Claim.findById(id);
    if (!claim) {
      res.status(404).json({ error: 'Claim not found.' });
      return;
    }

    claim.status = 'claim_verified';
    claim.meetingLocation = meetingLocation;
    claim.meetingDateTime = new Date(meetingDateTime);
    claim.alerts.push({
      type: 'meeting_scheduled',
      message: `Meeting scheduled at ${meetingLocation}.`,
      createdAt: new Date(),
    });
    await claim.save();

    await ClaimMeeting.findOneAndUpdate(
      { claimId: claim._id },
      {
        claimId: claim._id,
        itemId: claim.itemId,
        verificationId: claim.verificationId,
        meetingLocation,
        meetingDateTime: new Date(meetingDateTime),
        meetingDateTimeLocal: meetingDateTimeLocal ?? null,
        meetingTimeZone: meetingTimeZone ?? null,
        meetingUtcOffsetMinutes: meetingUtcOffsetMinutes ?? null,
        source: 'verification',
      },
      { upsert: true, new: true }
    );

    let updatedClaimsCount = 1;
    if (broadcastToAllClaimers) {
      const result = await Claim.updateMany(
        {
          itemId: claim.itemId,
          _id: { $ne: claim._id },
          status: { $in: ['pending_verification', 'claim_verified'] },
        },
        {
          $set: {
            status: 'claim_verified',
            meetingLocation,
            meetingDateTime: new Date(meetingDateTime),
          },
          $push: {
            alerts: {
              type: 'meeting_scheduled',
              message: `Meeting scheduled at ${meetingLocation}.`,
              createdAt: new Date(),
            },
          },
        }
      );
      updatedClaimsCount += result.modifiedCount;
    }

    res.json({ message: 'Claim moved to claim_verified.', updatedClaimsCount });
  } catch (err) {
    next(err);
  }
};

export const updateClaimMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      meetingLocation,
      meetingDateTime,
      meetingDateTimeLocal,
      meetingTimeZone,
      meetingUtcOffsetMinutes,
    } = req.body;

    if (!meetingLocation || !meetingDateTime) {
      res.status(400).json({ error: 'Meeting location and date/time are required.' });
      return;
    }

    const claim = await Claim.findById(id);
    if (!claim) {
      res.status(404).json({ error: 'Claim not found.' });
      return;
    }

    claim.meetingLocation = meetingLocation;
    claim.meetingDateTime = new Date(meetingDateTime);
    if (claim.status === 'pending_verification') {
      claim.status = 'claim_verified';
    }
    await claim.save();

    await ClaimMeeting.findOneAndUpdate(
      { claimId: claim._id },
      {
        claimId: claim._id,
        itemId: claim.itemId,
        verificationId: claim.verificationId,
        meetingLocation,
        meetingDateTime: new Date(meetingDateTime),
        meetingDateTimeLocal: meetingDateTimeLocal ?? null,
        meetingTimeZone: meetingTimeZone ?? null,
        meetingUtcOffsetMinutes: meetingUtcOffsetMinutes ?? null,
        source: 'manual_update',
      },
      { upsert: true, new: true }
    );

    res.json({ message: 'Meeting details updated.' });
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

    if (decision !== 'approve' && decision !== 'reject') {
      res.status(400).json({ error: 'Decision must be either approve or reject.' });
      return;
    }

    const claim = await Claim.findById(id);
    if (!claim) {
      res.status(404).json({ error: 'Claim not found.' });
      return;
    }

    claim.status = decision === 'approve' ? 'approved' : 'rejected';
    claim.alerts.push({
      type: 'claim_decision',
      message: decision === 'approve' ? 'Your claim has been approved.' : 'Your claim has been rejected.',
      createdAt: new Date(),
    });
    await claim.save();

    let rejectedOthersCount = 0;
    if (decision === 'approve') {
      const rejectOthers = await Claim.updateMany(
        {
          itemId: claim.itemId,
          _id: { $ne: claim._id },
          status: { $nin: ['approved', 'rejected'] },
        },
        {
          $set: { status: 'rejected' },
          $push: {
            alerts: {
              type: 'claim_decision',
              message: 'Another claimant was approved for this item.',
              createdAt: new Date(),
            },
          },
        }
      );
      rejectedOthersCount = rejectOthers.modifiedCount;

      await Item.findByIdAndUpdate(claim.itemId, {
        $set: {
          hasOwner: true,
          ownerClaimId: claim._id,
          claimStatus: 'claimed',
          needsOwnerReclaim: false,
        },
      } as Record<string, unknown>);
    }

    if (decision === 'reject') {
      await Item.findByIdAndUpdate(claim.itemId, {
        $set: {
          hasOwner: false,
          ownerClaimId: null,
          needsOwnerReclaim: true,
        },
      } as Record<string, unknown>);
    }

    res.json({ message: 'Claim resolved.', rejectedOthersCount });
  } catch (err) {
    next(err);
  }
};

export const deleteClaim = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const claim = await Claim.findById(id);
    if (!claim) {
      res.status(404).json({ error: 'Claim not found.' });
      return;
    }

    const wasApproved = claim.status === 'approved';
    const claimId = String(claim._id);
    const itemId = claim.itemId;

    await ClaimMeeting.deleteOne({ claimId: claim._id });
    await claim.deleteOne();

    if (wasApproved) {
      const item = await Item.findById(itemId);
      if (item && item.ownerClaimId && String(item.ownerClaimId) === claimId) {
        const replacementApprovedClaim = await Claim.findOne({ itemId, status: 'approved' }).sort({ updatedAt: -1 });

        if (replacementApprovedClaim) {
          item.hasOwner = true;
          item.ownerClaimId = replacementApprovedClaim._id;
          item.claimStatus = 'claimed';
          item.needsOwnerReclaim = false;
        } else {
          item.hasOwner = false;
          item.ownerClaimId = null;
          item.claimStatus = 'open';
          item.needsOwnerReclaim = true;
        }

        await item.save();
      }
    }

    res.json({ message: 'Claim removed successfully.' });
  } catch (err) {
    next(err);
  }
};
