import { describe, expect, it } from "vitest";
import { isTokenExpired, parseSetCookie } from "./token-utils";

function makeJwtWithExp(exp: number): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: "user-123", exp })).toString("base64url");
  const signature = "dummy-sig";
  return `${header}.${payload}.${signature}`;
}

describe("isTokenExpired", () => {
  it("returns true for null, undefined, or empty string", () => {
    expect(isTokenExpired(null)).toBe(true);
    expect(isTokenExpired(undefined)).toBe(true);
    expect(isTokenExpired("")).toBe(true);
  });

  it("returns true for malformed JWT strings", () => {
    expect(isTokenExpired("not-a-jwt")).toBe(true);
    expect(isTokenExpired("one.two")).toBe(true);
    expect(isTokenExpired("a.b.c.d")).toBe(true);
    expect(isTokenExpired("a.invalid-base64!.c")).toBe(true);
  });

  it("returns true if token lacks exp claim", () => {
    const header = Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ sub: "user-123" })).toString("base64url");
    expect(isTokenExpired(`${header}.${payload}.sig`)).toBe(true);
  });

  it("returns true if exp is in the past", () => {
    const pastExp = Math.floor(Date.now() / 1000) - 60; // 1 minute ago
    const token = makeJwtWithExp(pastExp);
    expect(isTokenExpired(token)).toBe(true);
  });

  it("returns true if token expires within the buffer window", () => {
    const nearExp = Math.floor(Date.now() / 1000) + 5; // 5 seconds in future, buffer is 10s
    const token = makeJwtWithExp(nearExp);
    expect(isTokenExpired(token, 10)).toBe(true);
  });

  it("returns false if token is safely in the future beyond buffer", () => {
    const futureExp = Math.floor(Date.now() / 1000) + 600; // 10 minutes in future
    const token = makeJwtWithExp(futureExp);
    expect(isTokenExpired(token, 10)).toBe(false);
  });
});

describe("parseSetCookie", () => {
  it("returns null for invalid inputs", () => {
    expect(parseSetCookie("")).toBe(null);
    expect(parseSetCookie("no-equals-sign")).toBe(null);
  });

  it("parses name, value, and attributes correctly", () => {
    const header = "access_token=xyz123; Max-Age=900; Path=/; HttpOnly; SameSite=Lax";
    const parsed = parseSetCookie(header);

    expect(parsed).toEqual({
      name: "access_token",
      value: "xyz123",
      maxAge: 900,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  });

  it("parses cookie with complex value containing equal signs", () => {
    const header = "custom_token=abc=123=def; Path=/custom; Secure";
    const parsed = parseSetCookie(header);

    expect(parsed).toEqual({
      name: "custom_token",
      value: "abc=123=def",
      path: "/custom",
      httpOnly: true,
      sameSite: "lax",
      secure: true,
    });
  });
});
