"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/features/auth/services/auth.service";
import { useVerificationListener } from "@/features/auth/hooks/use-verification-listener";
import { useAuth } from "@/providers/AuthProvider";
import { signInServerAction } from "@/features/auth/actions/auth.actions";
import { toast } from "@/components/ui/toast";

export interface UseCheckEmailNoticeOptions {
  email: string;
  userId: string;
  credentials?: { email: string; password: string };
}

export function useCheckEmailNotice({
  email,
  userId,
  credentials,
}: UseCheckEmailNoticeOptions) {
  const router = useRouter();
  const { setUser } = useAuth();
  const [cooldown, setCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  const { status } = useVerificationListener({
    userId,
    onVerified: async () => {
      if (credentials) {
        try {
          const result = await signInServerAction(credentials);
          if (result.success && result.user) {
            setUser(result.user);
            toast.add({
              title: "Email verified",
              description: "Welcome to Todo App!",
              type: "success",
            });
            router.push("/");
            router.refresh();
            return;
          }
        } catch {
          // Ignore
        }
      }

      toast.add({
        title: "Email verified",
        description: "Your account has been verified.",
        type: "success",
      });
    },
  });

  // 60-second cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;

    try {
      setIsResending(true);
      const res = await authService.resendVerificationEmail(email);
      setCooldown(60);
      toast.add({
        title: "Email sent",
        description:
          res.message || "A new verification email has been sent.",
        type: "success",
      });
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : err instanceof Error
            ? err.message
            : "Could not send verification email. Please try again later.";

      toast.add({
        title: "Unable to resend",
        description: message || "Please wait before requesting another email.",
        type: "error",
      });
    } finally {
      setIsResending(false);
    }
  };

  return {
    isVerified: status === "verified",
    cooldown,
    isResending,
    handleResend,
  };
}
