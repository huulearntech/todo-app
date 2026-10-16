"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordAction } from "@/features/auth/actions/auth.actions";
import {
  clientResetPasswordSchema,
  type ClientResetPasswordFormData,
} from "@/features/auth/schemas/auth.schemas";
import { toast } from "@/components/ui/toast";

interface UseResetPasswordFormOptions {
  token: string;
}

export function useResetPasswordForm({ token }: UseResetPasswordFormOptions) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ClientResetPasswordFormData>({
    resolver: zodResolver(clientResetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ClientResetPasswordFormData) => {
    try {
      setIsLoading(true);
      const result = await resetPasswordAction(token, data.newPassword);

      if (!result.success) {
        toast.add({
          title: "Reset failed",
          description: result.error || "Unable to reset password.",
          type: "error",
        });
        return;
      }

      setIsSuccess(true);
      toast.add({
        title: "Password reset",
        description:
          result.message ||
          "Your password has been reset successfully. Please sign in with your new password.",
        type: "success",
      });

      // Redirect to sign in after brief delay
      setTimeout(() => {
        router.push("/auth/sign-in");
      }, 2000);
    } catch {
      toast.add({
        title: "Error",
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
    isSuccess,
  };
}
