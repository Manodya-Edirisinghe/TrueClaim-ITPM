import { Request, Response } from 'express';
import ContactMessage from '../models/ContactMessage';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const createContactMessage = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const fullName = String(req.body?.fullName ?? '').trim();
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const message = String(req.body?.message ?? '').trim();

    if (!fullName || fullName.length < 2) {
      return res.status(400).json({ error: 'Please provide a valid full name.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (!message || message.length < 10) {
      return res.status(400).json({ error: 'Message should be at least 10 characters long.' });
    }

    const saved = await ContactMessage.create({
      fullName,
      email,
      message,
      sourcePage: 'landing-contact',
    });

    return res.status(201).json({
      message: 'Your message has been received. Our team will get back to you soon.',
      data: {
        id: saved._id,
        createdAt: saved.createdAt,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message ?? 'Failed to submit contact form.' });
  }
};
