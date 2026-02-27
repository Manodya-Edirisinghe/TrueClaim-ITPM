import { Router } from 'express';
import {
  getDashboardStats,
  getAllUsers,
  banUser,
  resolveDispute,
} from '../controllers/admin.controller';

// ─── Admin Routes ─────────────────────────────────────────────────────────────
// Owner: Osanda | Base: /api/admin

const router = Router();

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/ban', banUser);
router.patch('/disputes/:claimId/resolve', resolveDispute);

export default router;
