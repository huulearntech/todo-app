export interface ParsedCookie {
  name: string;
  value: string;
  maxAge?: number;
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
}

/**
 * Checks if a JWT is expired or malformed without cryptographic signature verification.
 * Safe for use at the edge or middleware layer for quick routing decisions.
 *
 * @param token The raw JWT string
 * @param bufferSeconds Safety buffer to treat tokens expiring very soon as already expired (default 10s)
 */
export function isTokenExpired(token: string | null | undefined, bufferSeconds = 10): boolean {
  if (!token || typeof token !== "string") {
    return true;
  }

  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return true;
    }

    const payloadJson = Buffer.from(parts[1], "base64url").toString("utf-8");
    const payload = JSON.parse(payloadJson);

    if (typeof payload.exp !== "number") {
      return true;
    }

    return payload.exp * 1000 <= Date.now() + bufferSeconds * 1000;
  } catch {
    return true;
  }
}

/**
 * Parses a standard HTTP `Set-Cookie` header string into structured cookie properties.
 */
export function parseSetCookie(cookieStr: string): ParsedCookie | null {
  if (!cookieStr || typeof cookieStr !== "string") {
    return null;
  }

  const parts = cookieStr.split(";").map((p) => p.trim());
  const [firstPart, ...attributes] = parts;
  const separatorIndex = firstPart.indexOf("=");

  if (separatorIndex === -1) {
    return null;
  }

  const name = firstPart.slice(0, separatorIndex).trim();
  const value = firstPart.slice(separatorIndex + 1).trim();

  if (!name) {
    return null;
  }

  const parsed: ParsedCookie = {
    name,
    value,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  };

  for (const attr of attributes) {
    const [attrName, ...attrValueParts] = attr.split("=");
    const normalizedName = attrName.trim().toLowerCase();
    const attrValue = attrValueParts.join("=").trim();

    if (normalizedName === "path") {
      parsed.path = attrValue || "/";
    } else if (normalizedName === "max-age") {
      const maxAgeNum = parseInt(attrValue, 10);
      if (!isNaN(maxAgeNum)) {
        parsed.maxAge = maxAgeNum;
      }
    } else if (normalizedName === "httponly") {
      parsed.httpOnly = true;
    } else if (normalizedName === "secure") {
      parsed.secure = true;
    } else if (normalizedName === "samesite") {
      const s = attrValue.toLowerCase();
      if (s === "strict" || s === "lax" || s === "none") {
        parsed.sameSite = s;
      }
    }
  }

  return parsed;
}
