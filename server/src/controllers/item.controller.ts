import { Request, Response, NextFunction } from 'express';

// ─── Item Controller ──────────────────────────────────────────────────────────
// Owner: Hashini | Handles CRUD operations for lost/found items

export const getAllItems = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  // TODO: Fetch all items from MongoDB
  res.json({ message: 'getAllItems – not yet implemented' });
};

export const getItemById = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  // TODO: Fetch a single item by ID
  res.json({ message: 'getItemById – not yet implemented' });
};

export const createItem = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  // TODO: Create a new lost/found item
  res.json({ message: 'createItem – not yet implemented' });
};

export const updateItem = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  // TODO: Update item details
  res.json({ message: 'updateItem – not yet implemented' });
};

export const deleteItem = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  // TODO: Delete an item
  res.json({ message: 'deleteItem – not yet implemented' });
};
