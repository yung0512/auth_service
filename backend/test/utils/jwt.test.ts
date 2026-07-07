import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { env } from "../../src/config/env";
import {
  signToken,
  signRefreshToken,
  verifyToken,
  verifyRefreshToken,
} from "../../src/utils/jwt";

const payload = { sub: 42, email: "alice@example.com" };

describe("jwt utils", () => {
  it("signs and verifies an access token, preserving the payload", () => {
    const token = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded).toEqual(payload);
  });

  it("signs and verifies a refresh token, preserving the payload", () => {
    const token = signRefreshToken(payload);
    const decoded = verifyRefreshToken(token);
    expect(decoded).toEqual(payload);
  });

  it("issues distinct strings for access and refresh tokens", () => {
    expect(signToken(payload)).not.toEqual(signRefreshToken(payload));
  });

  it("stamps a type claim so tokens are not interchangeable", () => {
    const access = jwt.decode(signToken(payload)) as { type: string };
    const refresh = jwt.decode(signRefreshToken(payload)) as { type: string };
    expect(access.type).toBe("access");
    expect(refresh.type).toBe("refresh");
  });

  it("rejects an access token passed to verifyRefreshToken", () => {
    const access = signToken(payload);
    expect(() => verifyRefreshToken(access)).toThrow();
  });

  it("rejects a refresh token passed to verifyToken", () => {
    const refresh = signRefreshToken(payload);
    expect(() => verifyToken(refresh)).toThrow();
  });

  it("rejects a token whose type claim is tampered but signed with the right secret", () => {
    // Same access secret, but the type claim says "refresh": the explicit
    // type guard in decode() must still reject it.
    const forged = jwt.sign({ ...payload, type: "refresh" }, env.jwtSecret);
    expect(() => verifyToken(forged)).toThrow("Expected access token");
  });

  it("rejects a garbage / malformed token", () => {
    expect(() => verifyToken("not-a-jwt")).toThrow();
    expect(() => verifyRefreshToken("not-a-jwt")).toThrow();
  });

  it("rejects an expired refresh token", () => {
    const expired = jwt.sign(
      { ...payload, type: "refresh" },
      env.jwtRefreshSecret,
      { expiresIn: -10 },
    );
    expect(() => verifyRefreshToken(expired)).toThrow();
  });
});
