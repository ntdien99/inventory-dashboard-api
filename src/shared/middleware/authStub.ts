import type { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const mockAuthMiddleware = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) => {
  req.user = {
    id: (req.headers["x-user-id"] as string) || "mgr_demo_101",
    role: "DEALERSHIP_MANAGER",
  };
  next();
};
