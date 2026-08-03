import logger from "@/shared/config/logger";
import { AppError } from "@/shared/errors/AppError";
import type { AuthenticatedRequest } from "@/shared/middleware/authStub.js";
import type { NextFunction, Response } from "express";
// import { ZodError } from "zod/v4";
import { ZodError } from "zod";

export const errorHandler = (
  err: Error,
  _req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction,
) => {
  logger.error(err.message, { stack: err.stack, name: err.name });

  // 2. Handle Zod Validation Errors (Returns 400 Bad Request)
  if (err instanceof ZodError) {
    const fieldErrors = err.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      error: "Validation Error",
      details: fieldErrors,
    });
  }

  // 3. Handle Domain/Operational Errors (AppError & subclasses)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // 4. Handle Syntax / JSON Parse Errors (e.g. malformed JSON payload)
  if (err instanceof SyntaxError && "status" in err && err.status === 400) {
    return res.status(400).json({
      success: false,
      error: "Invalid JSON payload",
    });
  }

  // 5. Fallback for unhandled/unexpected system errors (500)
  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message,
  });
};
