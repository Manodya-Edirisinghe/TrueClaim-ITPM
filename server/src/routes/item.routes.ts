import { Router } from 'express';
import { upload } from '../middlewares/upload.middleware';
import { requireAuth } from '../middlewares/auth.middleware';
import * as itemController from '../controllers/item.controller';

const router = Router();

router.post('/', requireAuth, upload.single('image'), itemController.createItem);

router.get('/', itemController.getItems);

router.get('/:id', itemController.getItem);

router.put('/:id', requireAuth, upload.single('image'), itemController.updateItem);

router.delete('/:id', requireAuth, itemController.deleteItem);

export default router;