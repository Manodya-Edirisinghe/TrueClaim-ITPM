import express from 'express';
import {
	registerUser,
	loginUser,
	getCurrentUser,
	updateCurrentUser,
	getUserDisplayNameById,
} from '../controllers/authController';
import { requireAuth } from '../middlewares/auth.middleware';

const router = express.Router();

// Register
router.post('/register', registerUser);

// Login
router.post('/login', loginUser);

// Current user
router.get('/me', requireAuth, getCurrentUser);
router.put('/me', requireAuth, updateCurrentUser);

// Display name lookup for messaging participant labels
router.get('/user/:userId', requireAuth, getUserDisplayNameById);

export default router;