import type { User } from "@prisma/client";
import { prisma } from "../config/db";

export const userRepository = {
  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  create(data: {
    email: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email,
        password: data.passwordHash,
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
      },
    });
  },
};
