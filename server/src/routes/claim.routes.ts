import { Router } from 'express';
import {
  getAllClaims,
  getClaimById,
  createClaim,
  verifyClaim,
  updateClaimMeeting,
  resolveClaim,
} from '../controllers/claim.controller';

// ─── Claim Routes ─────────────────────────────────────────────────────────────
// Owner: Lithira | Base: /api/claims

const router = Router();

router.get('/', getAllClaims);
router.get('/:id', getClaimById);
router.post('/', createClaim);
router.post('/:id/verify', verifyClaim);
router.patch('/:id/meeting', updateClaimMeeting);
router.patch('/:id/resolve', resolveClaim);

export default router;
