import { describe, expect, it, vi } from "vitest";
import type { Response } from "express";
import {
  REFRESH_COOKIE_NAME,
  setRefreshCookie,
  clearRefreshCookie,
} from "../../src/utils/cookies";

function fakeResponse() {
  return {
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  } as unknown as Response & {
    cookie: ReturnType<typeof vi.fn>;
    clearCookie: ReturnType<typeof vi.fn>;
  };
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

describe("refresh cookie helpers", () => {
  it("sets the refresh token as a hardened httpOnly cookie", () => {
    const res = fakeResponse();
    setRefreshCookie(res, "refresh-token-value");

    expect(res.cookie).toHaveBeenCalledTimes(1);
    const [name, value, options] = res.cookie.mock.calls[0];
    expect(name).toBe(REFRESH_COOKIE_NAME);
    expect(value).toBe("refresh-token-value");
    expect(options).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/api/auth",
      maxAge: SEVEN_DAYS_MS,
    });
  });

  it("scopes the cookie to /api/auth so it is not sent on ordinary API calls", () => {
    const res = fakeResponse();
    setRefreshCookie(res, "x");
    expect(res.cookie.mock.calls[0][2].path).toBe("/api/auth");
  });

  it("keeps secure disabled outside production (test env)", () => {
    const res = fakeResponse();
    setRefreshCookie(res, "x");
    expect(res.cookie.mock.calls[0][2].secure).toBe(false);
  });

  it("clears the cookie with matching options on logout", () => {
    const res = fakeResponse();
    clearRefreshCookie(res);

    expect(res.clearCookie).toHaveBeenCalledTimes(1);
    const [name, options] = res.clearCookie.mock.calls[0];
    expect(name).toBe(REFRESH_COOKIE_NAME);
    expect(options).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/api/auth",
    });
  });
});
