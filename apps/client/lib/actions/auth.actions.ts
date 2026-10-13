"use server";

import { cookies } from "next/headers";
import { signInSchema, type SignInDto, type UserResponseDto } from "@todo/shared";

const API_BASE_URL =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000";

export type SignInActionResult =
  | { success: true; user: UserResponseDto }
  | { success: false; error: string; code?: string };

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

  try {
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
      let errorCode: string | undefined;
      try {
        const errorJson = (await response.json()) as {
          message?: string | string[];
          code?: string;
        };
        if (typeof errorJson.message === "string") {
          errorMessage = errorJson.message;
        } else if (Array.isArray(errorJson.message)) {
          errorMessage = errorJson.message.join(", ");
        }
        errorCode = errorJson.code;
      } catch {
        // Fallback message
      }
      return {
        success: false,
        error: errorMessage,
        code: errorCode,
      };
    }

    const user = (await response.json()) as UserResponseDto;

    const cookieStore = await cookies();
    const setCookies = response.headers.getSetCookie();

    for (const cookieStr of setCookies) {
      const [nameVal] = cookieStr.split(";");
      const [name, val] = nameVal.split("=");
      if (name && val) {
        cookieStore.set(name.trim(), val.trim(), {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
      }
    }

    return {
      success: true,
      user,
    };
  } catch {
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

export async function resendVerificationEmailAction(
  email: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/magic-link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        success: false,
        message: "Failed to send verification email.",
      };
    }

    const data = (await response.json()) as { message?: string };
    return {
      success: true,
      message:
        data.message ||
        "If an account exists with this email, a verification link has been sent.",
    };
  } catch {
    return {
      success: false,
      message: "An unexpected network error occurred.",
    };
  }
}

export async function verifyMagicLinkAction(
  token: string,
): Promise<{ success: boolean; user?: UserResponseDto; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/magic-link/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
      cache: "no-store",
    });

    if (!response.ok) {
      let errorMessage = "Verification link is invalid or has expired.";
      try {
        const errorJson = (await response.json()) as { message?: string };
        if (errorJson.message) errorMessage = errorJson.message;
      } catch {
        // fallback
      }
      return { success: false, error: errorMessage };
    }

    const data = (await response.json()) as { user: UserResponseDto };
    const cookieStore = await cookies();
    const setCookies = response.headers.getSetCookie();

    for (const cookieStr of setCookies) {
      const [nameVal] = cookieStr.split(";");
      const [name, val] = nameVal.split("=");
      if (name && val) {
        cookieStore.set(name.trim(), val.trim(), {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
      }
    }

    return { success: true, user: data.user };
  } catch {
    return {
      success: false,
      error: "An unexpected error occurred during verification.",
    };
  }
}
