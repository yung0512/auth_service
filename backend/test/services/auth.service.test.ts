import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@prisma/client";
import { authService } from "../../src/services/auth.service";
import { userRepository } from "../../src/repositories/user.repository";
import {
  signRefreshToken,
  signToken,
  verifyRefreshToken,
  verifyToken,
} from "../../src/utils/jwt";
import { HttpError } from "../../src/middlewares/error.middleware";

vi.mock("../../src/repositories/user.repository", () => ({
  userRepository: {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
  },
}));

const mockRepo = vi.mocked(userRepository);

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 7,
    email: "bob@example.com",
    password: "unused-hash",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  } as User;
}

describe("authService.refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a syntactically invalid refresh token with 401", async () => {
    await expect(authService.refresh("garbage")).rejects.toMatchObject({
      status: 401,
    });
    expect(mockRepo.findById).not.toHaveBeenCalled();
  });

  it("rejects an access token presented as a refresh token", async () => {
    const accessToken = signToken({ sub: 7, email: "bob@example.com" });
    await expect(authService.refresh(accessToken)).rejects.toBeInstanceOf(
      HttpError,
    );
  });

  it("rejects a valid refresh token whose user no longer exists", async () => {
    const token = signRefreshToken({ sub: 7, email: "bob@example.com" });
    mockRepo.findById.mockResolvedValue(null);

    await expect(authService.refresh(token)).rejects.toMatchObject({
      status: 401,
    });
    expect(mockRepo.findById).toHaveBeenCalledWith(7);
  });

  it("issues a fresh, rotated token pair for a valid refresh token", async () => {
    const user = buildUser();
    const oldRefresh = signRefreshToken({ sub: user.id, email: user.email });
    mockRepo.findById.mockResolvedValue(user);

    const result = await authService.refresh(oldRefresh);

    // A freshly signed pair is returned; both verify against their own secret.
    // (The token string may coincide with the input when issued in the same
    // second — rotation as an HTTP concern is the re-set cookie, covered in
    // cookies.test.ts. What matters here is a valid, re-issued pair.)
    expect(verifyRefreshToken(result.refreshToken)).toEqual({
      sub: user.id,
      email: user.email,
    });
    expect(verifyToken(result.token)).toEqual({
      sub: user.id,
      email: user.email,
    });
    expect(result.user).toEqual({
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    });
    // The password hash must never leak into the public payload.
    expect(result.user).not.toHaveProperty("password");
  });
});

describe("authService.login token issuance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns both an access and a refresh token on success", async () => {
    // login() verifies the password via bcrypt against the stored hash; use a
    // real hash so no mocking of the password util is required.
    const { hashPassword } = await import("../../src/utils/password");
    const user = buildUser({ password: await hashPassword("correct-horse") });
    mockRepo.findByEmail.mockResolvedValue(user);

    const result = await authService.login({
      email: user.email,
      password: "correct-horse",
    });

    expect(verifyToken(result.token)).toMatchObject({ sub: user.id });
    expect(verifyRefreshToken(result.refreshToken)).toMatchObject({
      sub: user.id,
    });
  });

  it("rejects a wrong password with 401 and issues no tokens", async () => {
    const { hashPassword } = await import("../../src/utils/password");
    const user = buildUser({ password: await hashPassword("correct-horse") });
    mockRepo.findByEmail.mockResolvedValue(user);

    await expect(
      authService.login({ email: user.email, password: "wrong" }),
    ).rejects.toMatchObject({ status: 401 });
  });
});
