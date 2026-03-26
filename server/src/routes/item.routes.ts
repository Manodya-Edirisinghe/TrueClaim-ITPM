import { Router } from 'express';
import { upload } from '../middlewares/upload.middleware';
import * as itemController from '../controllers/item.controller';

const router = Router();

router.post('/', upload.single('image'), itemController.createItem);

router.get('/', itemController.getItems);

router.get('/:id', itemController.getItem);

router.post('/:id/queue-claimable', itemController.queueClaimableItem);
router.post('/:id/stop-queue', itemController.stopQueuedClaimableItem);
router.post('/:id/pause-queue', itemController.pauseQueuedClaimableItem);
router.post('/:id/resume-queue', itemController.resumeQueuedClaimableItem);
router.post('/:id/send-reclaim', itemController.sendQueuedItemToReclaim);

router.delete('/:id', itemController.deleteItem);

export default router;