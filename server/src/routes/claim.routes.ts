import { Router } from 'express';
import {
  getAllClaims,
  getClaimById,
  createClaim,
  verifyClaim,
  resolveClaim,
  getClaimAlertsByEmail,
} from '../controllers/claim.controller';

// ─── Claim Routes ─────────────────────────────────────────────────────────────
// Owner: Lithira | Base: /api/claims

const router = Router();

router.get('/', getAllClaims);
router.get('/alerts/:email', getClaimAlertsByEmail);
router.get('/:id', getClaimById);
router.post('/', createClaim);
router.post('/:id/verify', verifyClaim);
router.patch('/:id/resolve', resolveClaim);

export default router;
