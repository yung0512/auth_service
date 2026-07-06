import { userRepository } from '../repositories/user.repository';
import { hashPassword, verifyPassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { toPublicUser, type PublicUser } from '../models/user.model';
import { HttpError } from '../middlewares/error.middleware';
import type { LoginInput, RegisterInput } from '../schemas/auth.schema';

export const authService = {
  async register(input: RegisterInput): Promise<PublicUser> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new HttpError(409, 'Email already registered');
    }
    const hash = await hashPassword(input.password);
    const user = await userRepository.create(input.email, hash);
    return toPublicUser(user);
  },

  async login(input: LoginInput): Promise<{ token: string; user: PublicUser }> {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new HttpError(401, 'Invalid credentials');
    }
    const ok = await verifyPassword(input.password, user.password);
    if (!ok) {
      throw new HttpError(401, 'Invalid credentials');
    }
    const token = signToken({ sub: user.id, email: user.email });
    return { token, user: toPublicUser(user) };
  },

  async me(userId: number): Promise<PublicUser> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new HttpError(404, 'User not found');
    }
    return toPublicUser(user);
  },
};
