import { Router } from 'express';
import { upload } from '../middlewares/upload.middleware';
import * as itemController from '../controllers/item.controller';

const router = Router();

router.post('/', upload.single('image'), itemController.createItem);

router.get('/', itemController.getItems);

router.get('/:id', itemController.getItem);

router.put('/:id', upload.single('image'), itemController.updateItem);

router.delete('/:id', itemController.deleteItem);

export default router;