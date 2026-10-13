/**
 * Centralized backend configuration utility for Next.js SSR, Server Actions, and API rewrites.
 * Enforces fail-fast behavior if the backend URL is missing.
 */
export function getBackendApiUrl(): string {
  const apiUrl =
    process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiUrl) {
    throw new Error(
      "[CONFIG ERROR] Missing required backend API URL (API_BASE_URL or NEXT_PUBLIC_API_BASE_URL). " +
        "The application cannot start with unconfigured API endpoints. Please set API_BASE_URL in your environment.",
    );
  }

  try {
    const parsed = new URL(apiUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error();
    }
  } catch {
    throw new Error(
      `[CONFIG ERROR] Invalid backend API URL: "${apiUrl}". ` +
        "It must be a valid absolute HTTP or HTTPS URL (e.g., http://localhost:4000 or https://api.todo.app).",
    );
  }

  return apiUrl.replace(/\/+$/, "");
}
