import { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
  };
};

// ─── REGISTER ─────────────────────────────────────────
export const registerUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const {
      fullName,
      studentId,
      universityEmail,
      phoneNumber,
      faculty,
      academicYear,
      password
    } = req.body;

    const existingUser = await User.findOne({
      $or: [{ universityEmail }, { studentId }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      fullName,
      studentId,
      universityEmail,
      phoneNumber,
      faculty,
      academicYear,
      password: hashedPassword
    });

    await user.save();

    return res.status(201).json({ message: 'User registered successfully' });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ─── LOGIN ─────────────────────────────────────────
export const loginUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { universityEmail, password } = req.body;

    const user = await User.findOne({ universityEmail });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user
    });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ─── CURRENT USER (JWT) ─────────────────────────────────
export const getCurrentUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};