import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getBackendApiUrl } from "./config";

describe("getBackendApiUrl", () => {
  const originalApiBaseUrl = process.env.API_BASE_URL;
  const originalNextPublicUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    delete process.env.API_BASE_URL;
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
  });

  afterEach(() => {
    process.env.API_BASE_URL = originalApiBaseUrl;
    process.env.NEXT_PUBLIC_API_BASE_URL = originalNextPublicUrl;
  });

  it("returns API_BASE_URL when defined", () => {
    process.env.API_BASE_URL = "https://api.todo.app";
    expect(getBackendApiUrl()).toBe("https://api.todo.app");
  });

  it("strips trailing slashes from API_BASE_URL", () => {
    process.env.API_BASE_URL = "https://api.todo.app///";
    expect(getBackendApiUrl()).toBe("https://api.todo.app");
  });

  it("falls back to NEXT_PUBLIC_API_BASE_URL when API_BASE_URL is not defined", () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:4000";
    expect(getBackendApiUrl()).toBe("http://localhost:4000");
  });

  it("prioritizes API_BASE_URL over NEXT_PUBLIC_API_BASE_URL", () => {
    process.env.API_BASE_URL = "http://internal-backend:4000";
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://public.todo.app";
    expect(getBackendApiUrl()).toBe("http://internal-backend:4000");
  });

  it("fails fast by throwing an Error when both are missing", () => {
    expect(() => getBackendApiUrl()).toThrowError(/Missing required backend API URL/);
  });

  it("fails fast when API URL is not a valid URL format", () => {
    process.env.API_BASE_URL = "not-a-valid-url";
    expect(() => getBackendApiUrl()).toThrowError(/Invalid backend API URL/);
  });

  it("fails fast when API URL uses an unsupported protocol", () => {
    process.env.API_BASE_URL = "ftp://localhost:4000";
    expect(() => getBackendApiUrl()).toThrowError(/Invalid backend API URL/);
  });
});
