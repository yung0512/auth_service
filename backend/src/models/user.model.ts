import type { User } from "@prisma/client";

export interface PublicUser {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    createdAt: user.createdAt,
  };
}
