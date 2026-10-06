"use server";

import { cookies } from "next/headers";
import { signInSchema, type SignInDto, type UserResponseDto } from "@todo/shared";

const API_BASE_URL =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000";

function parseSetCookie(cookieStr: string) {
  const parts = cookieStr.split(";").map((p) => p.trim());
  const [firstPart, ...attributes] = parts;
  const equalIdx = firstPart.indexOf("=");
  if (equalIdx === -1) return null;
  const name = firstPart.slice(0, equalIdx);
  const value = firstPart.slice(equalIdx + 1);

  const options: {
    path?: string;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "lax" | "strict" | "none";
    maxAge?: number;
    expires?: Date;
  } = {};

  for (const attr of attributes) {
    const [attrName, ...valParts] = attr.split("=");
    const attrVal = valParts.join("=");
    const lower = attrName.toLowerCase();
    if (lower === "path") {
      options.path = attrVal;
    } else if (lower === "httponly") {
      options.httpOnly = true;
    } else if (lower === "secure") {
      options.secure = true;
    } else if (lower === "samesite") {
      const sameSiteVal = attrVal?.toLowerCase();
      if (
        sameSiteVal === "lax" ||
        sameSiteVal === "strict" ||
        sameSiteVal === "none"
      ) {
        options.sameSite = sameSiteVal;
      }
    } else if (lower === "max-age") {
      const parsedAge = parseInt(attrVal, 10);
      if (!isNaN(parsedAge)) options.maxAge = parsedAge;
    } else if (lower === "expires") {
      const parsedDate = new Date(attrVal);
      if (!isNaN(parsedDate.getTime())) options.expires = parsedDate;
    }
  }

  return { name, value, options };
}

export type SignInActionResult =
  | { success: true; user: UserResponseDto }
  | { success: false; error: string };

export async function signInServerAction(
  data: SignInDto,
): Promise<SignInActionResult> {
  const parsed = signInSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid email or password format.",
    };
  }

  const response = await fetch(`${API_BASE_URL}/auth/sign-in`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(parsed.data),
    cache: "no-store",
  });

  if (!response.ok) {
    let errorMessage = "Invalid email or password. Please try again.";
    try {
      const errorJson = (await response.json()) as {
        message?: string | string[];
      };
      if (typeof errorJson.message === "string") {
        errorMessage = errorJson.message;
      } else if (Array.isArray(errorJson.message)) {
        errorMessage = errorJson.message.join(", ");
      }
    } catch {
      // Fallback message
    }
    return {
      success: false,
      error: errorMessage,
    };
  }

  const user = (await response.json()) as UserResponseDto;

  const cookieStore = await cookies();
  const setCookies = response.headers.getSetCookie();

  for (const cookieStr of setCookies) {
    const parsedCookie = parseSetCookie(cookieStr);
    if (parsedCookie) {
      cookieStore.set(
        parsedCookie.name,
        parsedCookie.value,
        parsedCookie.options,
      );
    }
  }

  return {
    success: true,
    user,
  };
}
