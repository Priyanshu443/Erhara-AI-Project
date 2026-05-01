import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

export interface AuthRequest extends Request {
  clerkUserId: string;
}

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as AuthRequest).clerkUserId = userId;
  next();
};
