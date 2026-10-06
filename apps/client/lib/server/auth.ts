import { redirect } from "next/navigation";
import { getCurrentUser } from "./api/user";
import { UnauthorizedError } from "./errors";
import type { UserResponseDto } from "@todo/shared";

/**
 * Asserts that a user is authenticated during server-side rendering.
 * Redirects to `/auth` if the user is unauthenticated or token is expired/invalid.
 */
export async function requireUser(redirectPath?: string): Promise<UserResponseDto> {
  try {
    return await getCurrentUser();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      if (redirectPath) {
        redirect(`/auth?redirect=${encodeURIComponent(redirectPath)}`);
      }
      redirect("/auth");
    }
    throw error;
  }
}

/**
 * Retrieves the current user if authenticated, returning null if unauthenticated.
 * Ideal for root layouts and public pages with optional authenticated states.
 */
export async function getOptionalUser(): Promise<UserResponseDto | null> {
  try {
    return await getCurrentUser();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return null;
    }
    // Return null on failure to prevent entire root layout from breaking
    return null;
  }
}
