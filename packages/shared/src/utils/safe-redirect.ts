export function getSafeRedirectUrl(
  target: string | null | undefined,
  fallback = "/",
): string {
  if (!target || typeof target !== "string") return fallback;

  // Reject backslashes or URL-encoded backslashes (%5c / %5C)
  if (target.includes("\\") || /%5c/i.test(target)) {
    return fallback;
  }

  try {
    const url = new URL(target, "http://x.invalid");
    if (url.origin !== "http://x.invalid") {
      return fallback;
    }
    if (!url.pathname.startsWith("/") || url.pathname.startsWith("//")) {
      return fallback;
    }
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
