import "./config/loadEnv";
import mongoose, { Types } from 'mongoose';
import { Claim } from './models/Claim';
import { Item } from './models/item.model';

const APPROVED_ITEM_ID = new Types.ObjectId('66f100000000000000000001');
const REJECTED_ITEM_ID = new Types.ObjectId('66f100000000000000000002');

const approvedVerificationId = 'DEMO-APPROVED-001';
const rejectedVerificationId = 'DEMO-REJECTED-001';

async function seedClaimsDemo(): Promise<void> {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is missing in server/.env');
  }

  await mongoose.connect(mongoUri);

  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const approvedItem = await Item.findOneAndUpdate(
    { _id: APPROVED_ITEM_ID },
    {
      itemType: 'found',
      itemTitle: 'Demo Approved Laptop',
      itemCategory: 'Electronics',
      description: 'Seeded demo item for approved-claim dashboard testing.',
      time: oneDayAgo,
      location: 'Main Library',
      contactNumber: '0770000001',
      hasOwner: true,
      claimStatus: 'claimed',
      needsOwnerReclaim: false,
      claimableQueueStartedAt: null,
      claimableQueueEndsAt: null,
      claimableQueuePaused: false,
      claimableQueueRemainingMs: null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const rejectedItem = await Item.findOneAndUpdate(
    { _id: REJECTED_ITEM_ID },
    {
      itemType: 'found',
      itemTitle: 'Demo Rejected Backpack',
      itemCategory: 'Accessories',
      description: 'Seeded demo item for rejected-claim dashboard testing.',
      time: oneDayAgo,
      location: 'Engineering Block',
      contactNumber: '0770000002',
      hasOwner: false,
      claimStatus: 'open',
      ownerClaimId: null,
      needsOwnerReclaim: true,
      claimableQueueStartedAt: null,
      claimableQueueEndsAt: null,
      claimableQueuePaused: false,
      claimableQueueRemainingMs: null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const approvedClaim = await Claim.findOneAndUpdate(
    { verificationId: approvedVerificationId },
    {
      itemId: approvedItem._id,
      claimantName: 'Demo Approved User',
      claimantEmail: 'approved.demo@trueclaim.com',
      claimantContactNumber: '0711111111',
      ownershipPassword: 'demo-pass-approved',
      serialNumber: 'APP-001-XYZ',
      lostPlace: 'Main Library',
      verificationId: approvedVerificationId,
      verificationStartedAt: twoDaysAgo,
      verificationEndsAt: oneDayAgo,
      meetingLocation: 'Admin Office',
      meetingDateTime: now,
      status: 'approved',
      alerts: [
        {
          type: 'verification_started',
          message: 'Demo: verification started for approved claim.',
          createdAt: twoDaysAgo,
        },
        {
          type: 'meeting_scheduled',
          message: 'Demo: meeting scheduled for approved claim.',
          createdAt: oneDayAgo,
        },
        {
          type: 'claim_decision',
          message: 'Demo: this claim is approved.',
          createdAt: now,
        },
      ],
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Claim.findOneAndUpdate(
    { verificationId: rejectedVerificationId },
    {
      itemId: rejectedItem._id,
      claimantName: 'Demo Rejected User',
      claimantEmail: 'rejected.demo@trueclaim.com',
      claimantContactNumber: '0722222222',
      ownershipPassword: 'demo-pass-rejected',
      serialNumber: 'REJ-002-XYZ',
      lostPlace: 'Engineering Block',
      verificationId: rejectedVerificationId,
      verificationStartedAt: twoDaysAgo,
      verificationEndsAt: oneDayAgo,
      meetingLocation: 'Verification Desk',
      meetingDateTime: oneDayAgo,
      status: 'rejected',
      alerts: [
        {
          type: 'verification_started',
          message: 'Demo: verification started for rejected claim.',
          createdAt: twoDaysAgo,
        },
        {
          type: 'claim_decision',
          message: 'Demo: this claim is rejected.',
          createdAt: now,
        },
      ],
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Item.findByIdAndUpdate(approvedItem._id, {
    ownerClaimId: approvedClaim._id,
    hasOwner: true,
    claimStatus: 'claimed',
  });

  console.log('Seed complete: added/updated demo approved and rejected claims.');
  await mongoose.disconnect();
}

seedClaimsDemo()
  .then(() => {
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Seed failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  });
