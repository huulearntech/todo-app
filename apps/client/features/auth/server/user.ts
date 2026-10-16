import { cache } from "react";
import { serverFetch } from "@/lib/server/api-client";
import { userResponseSchema, type UserResponseDto } from "@todo/shared";

/**
 * Fetch the current user on the server.
 * Uses React `cache()` for per-request memoization, ensuring multiple components
 * within the same request lifecycle only trigger a single backend request.
 * Validates data integrity to ensure required fields like `defaultProjectId` are valid UUIDs.
 */
export const getCurrentUser = cache(async (): Promise<UserResponseDto> => {
  const data = await serverFetch<unknown>("/auth/me");
  const parsed = userResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(
      `Corrupted user account state: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`,
    );
  }
  return parsed.data;
});

