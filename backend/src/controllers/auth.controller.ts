import type { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { loginSchema, registerSchema } from "../schemas/auth.schema";
import type { AuthRequest } from "../middlewares/auth.middleware";
import {
  REFRESH_COOKIE_NAME,
  setRefreshCookie,
  clearRefreshCookie,
} from "../utils/cookies";
import { HttpError } from "../middlewares/error.middleware";

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const input = registerSchema.parse(req.body);
    const user = await authService.register(input);
    res.status(201).json({ success: true, data: user, error: null });
  },

  async login(req: Request, res: Response): Promise<void> {
    const input = loginSchema.parse(req.body);
    const { token, refreshToken, user } = await authService.login(input);
    setRefreshCookie(res, refreshToken);
    res.status(200).json({ success: true, data: { token, user }, error: null });
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const cookieToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!cookieToken) {
      throw new HttpError(401, "Missing refresh token");
    }
    const { token, refreshToken, user } =
      await authService.refresh(cookieToken);
    setRefreshCookie(res, refreshToken);
    res.status(200).json({ success: true, data: { token, user }, error: null });
  },

  async logout(_req: AuthRequest, res: Response): Promise<void> {
    clearRefreshCookie(res);
    res.status(200).json({ success: true, data: null, error: null });
  },

  async me(req: AuthRequest, res: Response): Promise<void> {
    const user = await authService.me(req.userId as number);
    res.status(200).json({ success: true, data: user, error: null });
  },
};
