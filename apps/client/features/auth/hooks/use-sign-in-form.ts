"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, type SignInDto } from "@todo/shared";
import { useAuth } from "@/providers/AuthProvider";
import {
  signInServerAction,
  resendVerificationEmailAction,
} from "@/features/auth/actions/auth.actions";
import { toast } from "@/components/ui/toast";
import { getSafeRedirectUrl } from "@/lib/safe-redirect";

export function useSignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const form = useForm<SignInDto>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    try {
      setIsResending(true);
      const res = await resendVerificationEmailAction(unverifiedEmail);
      if (res.success) {
        toast.add({
          title: "Verification email sent",
          description: res.message,
          type: "success",
        });
      } else {
        toast.add({
          title: "Failed to resend",
          description: res.message,
          type: "error",
        });
      }
    } finally {
      setIsResending(false);
    }
  };

  const onSubmit = async (data: SignInDto) => {
    try {
      setIsLoading(true);
      const result = await signInServerAction(data);

      if (!result.success) {
        if (
          result.code === "EMAIL_NOT_VERIFIED" ||
          result.error.toLowerCase().includes("verify your email")
        ) {
          setUnverifiedEmail(data.email);
        } else {
          setUnverifiedEmail(null);
        }
        toast.add({
          title: "Error signing in",
          description: result.error,
          type: "error",
        });
        return;
      }

      setUnverifiedEmail(null);

      // 1. Update AuthProvider user state
      setUser(result.user);

      // 2. Display success toast
      toast.add({
        title: "Signed in successfully!",
        description: "Welcome back!",
        type: "success",
      });

      // 3. Navigate to destination or homepage
      const redirectParam = searchParams.get("redirect");
      const destination = getSafeRedirectUrl(redirectParam, "/");

      router.push(destination);
      router.refresh();
    } catch {
      toast.add({
        title: "Error signing in",
        description: "An unexpected error occurred. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    control: form.control,
    handleSubmit: form.handleSubmit,
    onSubmit,
    isLoading,
    unverifiedEmail,
    isResending,
    handleResendVerification,
  };
}
