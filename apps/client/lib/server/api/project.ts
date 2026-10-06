import { cache } from "react";
import { serverFetch } from "../api-client";
import type { ProjectResponseDto } from "@todo/shared";

/**
 * Fetch a project by its ID on the server.
 * Uses React `cache()` for per-request memoization, ensuring that
 * `generateMetadata` and `ProjectLayout` share the same backend request.
 */

// NOTE: Why the fuck do I need cache here when I'm using Next.js fetch?
export const getProjectById = cache(
  async (id: string): Promise<ProjectResponseDto | null> => {
    try {
      return await serverFetch<ProjectResponseDto>(`/projects/${id}`);
    } catch {
      return null;
    }
  },
);
