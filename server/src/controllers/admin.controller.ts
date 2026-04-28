import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { Item } from '../models/item.model';
import Feedback from '../models/Feedback';

// ─── Admin Controller ─────────────────────────────────────────────────────────
// Owner: Osanda | Handles dashboard, user management & dispute resolution

export const getDashboardStats = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  const [totalItems, lostItems, foundItems, claimedItems, totalUsers, totalFeedbacks] =
    await Promise.all([
      Item.countDocuments(),
      Item.countDocuments({ itemType: 'lost' }),
      Item.countDocuments({ itemType: 'found' }),
      Item.countDocuments({ claimStatus: 'claimed' }),
      User.countDocuments(),
      Feedback.countDocuments(),
    ]);

  // Items reported per day for the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const itemsOverTime = await Item.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Items by category
  const itemsByCategory = await Item.aggregate([
    { $group: { _id: '$itemCategory', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 6 },
  ]);

  // Average feedback ratings
  const feedbackAvg = await Feedback.aggregate([
    {
      $group: {
        _id: null,
        easeOfReporting:    { $avg: '$easeOfReporting' },
        speedOfResponse:    { $avg: '$speedOfResponse' },
        platformNavigation: { $avg: '$platformNavigation' },
        staffHelpfulness:   { $avg: '$staffHelpfulness' },
        overallSatisfaction:{ $avg: '$overallSatisfaction' },
      },
    },
  ]);

  res.json({
    stats: { totalItems, lostItems, foundItems, claimedItems, totalUsers, totalFeedbacks },
    itemsOverTime,
    itemsByCategory,
    feedbackAvg: feedbackAvg[0] ?? null,
  });
};

export const getAllUsers = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json({ users });
};

export const getAllFeedback = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  const feedbacks = await Feedback.find().sort({ createdAt: -1 });
  res.json({ feedbacks });
};

export const getAllItems = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  const items = await Item.find().sort({ createdAt: -1 });
  res.json({ items });
};

export const banUser = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  res.json({ message: 'banUser – not yet implemented' });
};

export const resolveDispute = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  res.json({ message: 'resolveDispute – not yet implemented' });
};
