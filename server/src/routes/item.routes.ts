import { Router } from 'express';
import { upload } from '../middlewares/upload.middleware';
import { requireAuth } from '../middlewares/auth.middleware';
import * as itemController from '../controllers/item.controller';

const router = Router();

router.post('/', upload.single('image'), itemController.createItem);

router.get('/', itemController.getItems);

router.get('/:id', itemController.getItem);

router.post('/:id/queue-claimable', itemController.queueClaimableItem);
router.post('/:id/stop-queue', itemController.stopClaimableQueue);
router.post('/:id/pause-queue', itemController.pauseClaimableQueue);
router.post('/:id/resume-queue', itemController.resumeClaimableQueue);
router.post('/:id/send-reclaim', itemController.sendToReclaim);
router.post('/:id/manual-approve', itemController.manualApproveFromQueue);

router.put('/:id', requireAuth, upload.single('image'), itemController.updateItem);

router.delete('/:id', requireAuth, itemController.deleteItem);

export default router;