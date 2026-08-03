import type { Response, NextFunction } from "express";
import logger from "@/shared/config/logger.js";
import type { AuthenticatedRequest } from "@/shared/middleware/authStub.js";

export const httpLogger = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  res.on("finish", () => {
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      userId: req.user?.id,
    });
  });
  next();
};
