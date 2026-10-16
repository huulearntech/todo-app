import { describe, it, expect } from "vitest";
import {
  signUpFormSchema,
  clientResetPasswordSchema,
} from "./auth.schemas";

describe("signUpFormSchema", () => {
  it("should validate when password and confirmPassword match", () => {
    const validData = {
      email: "test@example.com",
      name: "Test User",
      password: "password123",
      confirmPassword: "password123",
    };

    const result = signUpFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should fail validation when confirmPassword does not match", () => {
    const invalidData = {
      email: "test@example.com",
      name: "Test User",
      password: "password123",
      confirmPassword: "differentPassword",
    };

    const result = signUpFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path[0] === "confirmPassword",
      );
      expect(issue).toBeDefined();
      expect(issue?.message).toBe("Passwords do not match");
    }
  });

  it("should fail validation when confirmPassword is empty", () => {
    const invalidData = {
      email: "test@example.com",
      name: "Test User",
      password: "password123",
      confirmPassword: "",
    };

    const result = signUpFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe("clientResetPasswordSchema", () => {
  it("should validate valid matching passwords", () => {
    const validData = {
      newPassword: "validPassword123",
      confirmPassword: "validPassword123",
    };

    const result = clientResetPasswordSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject password shorter than 8 characters", () => {
    const invalidData = {
      newPassword: "short",
      confirmPassword: "short",
    };

    const result = clientResetPasswordSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.includes("at least 8 characters"),
        ),
      ).toBe(true);
    }
  });

  it("should reject mismatched passwords", () => {
    const invalidData = {
      newPassword: "password1234",
      confirmPassword: "password5678",
    };

    const result = clientResetPasswordSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.message === "Passwords do not match"),
      ).toBe(true);
    }
  });
});
