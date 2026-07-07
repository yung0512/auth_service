import type { Response } from "express";
import { env } from "../config/env";

export const REFRESH_COOKIE_NAME = "refresh_token";

const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const baseOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.cookieSecure,
  path: "/api/auth",
};

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...baseOptions,
    maxAge: REFRESH_MAX_AGE_MS,
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, baseOptions);
}
