import express from 'express';
import {
	registerUser,
	loginUser,
	getCurrentUser,
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

// Display name lookup for messaging participant labels
router.get('/user/:userId', requireAuth, getUserDisplayNameById);

export default router;