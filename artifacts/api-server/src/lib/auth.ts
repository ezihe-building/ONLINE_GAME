import type { Request, Response, NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as any).userId = userId;
  next();
};

export const getUserId = (req: Request): number => {
  return (req as any).userId as number;
};
