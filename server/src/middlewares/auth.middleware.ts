import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
  };
};

type TokenPayload = JwtPayload & {
  id?: string;
};

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthenticatedRequest;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: missing bearer token' });
    return;
  }

  const token = authHeader.slice(7).trim();
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(401).json({ error: 'Unauthorized: JWT secret is not configured' });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as string | TokenPayload;

    const userId =
      typeof decoded === 'string'
        ? null
        : typeof decoded.id === 'string' && decoded.id.trim().length > 0
          ? decoded.id
          : null;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: invalid token payload' });
      return;
    }

    authReq.user = { id: userId };
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized: invalid or expired token' });
  }
}
