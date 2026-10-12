/**
 * Validates and sanitizes a target redirect URL to prevent open redirect vulnerabilities.
 * Only allows relative paths starting with a single '/' and not '//'.
 */
export function getSafeRedirectUrl(
  target: string | null | undefined,
  fallback = "/",
): string {
  if (!target) return fallback;
  if (target.startsWith("/") && !target.startsWith("//")) {
    return target;
  }
  return fallback;
}
