import { Request, Response, NextFunction } from 'express';

// ─── Message Controller ───────────────────────────────────────────────────────
// Owner: Manodya | Handles real-time chat & item matching via Socket.io

export const getMessagesByRoom = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  // TODO: Fetch chat history for a specific room/conversation
  res.json({ message: 'getMessagesByRoom – not yet implemented' });
};

export const sendMessage = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  // TODO: Persist a message and emit via Socket.io
  res.json({ message: 'sendMessage – not yet implemented' });
};

export const getMatchedItems = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  // TODO: Run matching algorithm between lost and found items
  res.json({ message: 'getMatchedItems – not yet implemented' });
};
