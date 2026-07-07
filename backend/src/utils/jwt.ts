import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthTokenPayload {
  sub: number;
  email: string;
}

type TokenType = 'access' | 'refresh';

interface SignedPayload extends AuthTokenPayload {
  type: TokenType;
}

export function signToken(payload: AuthTokenPayload): string {
  const body: SignedPayload = { ...payload, type: 'access' };
  return jwt.sign(body, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(payload: AuthTokenPayload): string {
  const body: SignedPayload = { ...payload, type: 'refresh' };
  return jwt.sign(body, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

function decode(token: string, secret: string, expected: TokenType): AuthTokenPayload {
  const decoded = jwt.verify(token, secret) as unknown as SignedPayload;
  if (decoded.type !== expected) {
    throw new Error(`Expected ${expected} token`);
  }
  return { sub: decoded.sub, email: decoded.email };
}

export function verifyToken(token: string): AuthTokenPayload {
  return decode(token, env.jwtSecret, 'access');
}

export function verifyRefreshToken(token: string): AuthTokenPayload {
  return decode(token, env.jwtRefreshSecret, 'refresh');
}
