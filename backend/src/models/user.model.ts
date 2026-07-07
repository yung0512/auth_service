import type { User } from "@prisma/client";

export interface PublicUser {
  id: number;
  email: string;
  createdAt: Date;
}

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}
