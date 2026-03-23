import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Multer errors (file size, file type)
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File size exceeds the 5 MB limit'
        : err.message;
    res.status(400).json({ error: message });
    return;
  }

  // Custom file-filter error
  if (err.message?.startsWith('Only JPEG')) {
    res.status(400).json({ error: err.message });
    return;
  }

  const statusCode = err.statusCode ?? 500;
  const message =
    err.isOperational
      ? err.message
      : 'An unexpected error occurred. Please try again.';

  console.error('[Error]', err);
  res.status(statusCode).json({ error: message });
};