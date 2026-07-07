import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../utils/logger";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      data: null,
      error: err.issues.map((i) => i.message).join(", "),
    });
    return;
  }
  if (err instanceof HttpError) {
    res
      .status(err.status)
      .json({ success: false, data: null, error: err.message });
    return;
  }
  if (err instanceof Error) {
    logger.error(err.message, { stack: err.stack });
  } else {
    logger.error("Unhandled non-error thrown", { err });
  }
  res
    .status(500)
    .json({ success: false, data: null, error: "Internal server error" });
}
