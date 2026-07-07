import { userRepository } from "../repositories/user.repository";
import { hashPassword, verifyPassword } from "../utils/password";
import { signToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { toPublicUser, type PublicUser } from "../models/user.model";
import { HttpError } from "../middlewares/error.middleware";
import type { LoginInput, RegisterInput } from "../schemas/auth.schema";

interface AuthTokens {
  token: string;
  refreshToken: string;
  user: PublicUser;
}

function issueTokens(user: { id: number; email: string }): {
  token: string;
  refreshToken: string;
} {
  return {
    token: signToken({ sub: user.id, email: user.email }),
    refreshToken: signRefreshToken({ sub: user.id, email: user.email }),
  };
}

export const authService = {
  async register(input: RegisterInput): Promise<PublicUser> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new HttpError(409, "Email already registered");
    }
    const hash = await hashPassword(input.password);
    const user = await userRepository.create(input.email, hash);
    return toPublicUser(user);
  },

  async login(input: LoginInput): Promise<AuthTokens> {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new HttpError(401, "Invalid credentials");
    }
    const ok = await verifyPassword(input.password, user.password);
    if (!ok) {
      throw new HttpError(401, "Invalid credentials");
    }
    return { ...issueTokens(user), user: toPublicUser(user) };
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new HttpError(401, "Invalid or expired refresh token");
    }
    const user = await userRepository.findById(payload.sub);
    if (!user) {
      throw new HttpError(401, "Invalid or expired refresh token");
    }
    return { ...issueTokens(user), user: toPublicUser(user) };
  },

  async me(userId: number): Promise<PublicUser> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    return toPublicUser(user);
  },
};
