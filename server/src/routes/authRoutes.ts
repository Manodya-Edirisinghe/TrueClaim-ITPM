import express from 'express';
import { registerUser, loginUser, getCurrentUser } from '../controllers/authController';
import { requireAuth } from '../middlewares/auth.middleware';

const router = express.Router();

// Register
router.post('/register', registerUser);

// Login
router.post('/login', loginUser);

// Current user
router.get('/me', requireAuth, getCurrentUser);

export default router;