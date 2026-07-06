import type { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { loginSchema, registerSchema } from "../schemas/auth.schema";
import type { AuthRequest } from "../middlewares/auth.middleware";

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const input = registerSchema.parse(req.body);
    const user = await authService.register(input);
    res.status(201).json({ success: true, data: user, error: null });
  },

  async login(req: Request, res: Response): Promise<void> {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    res.status(200).json({ success: true, data: result, error: null });
  },

  async me(req: AuthRequest, res: Response): Promise<void> {
    const user = await authService.me(req.userId as number);
    res.status(200).json({ success: true, data: user, error: null });
  },
};
