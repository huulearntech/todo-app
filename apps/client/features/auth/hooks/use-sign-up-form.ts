"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authService } from "@/features/auth/services/auth.service";
import { AUTH_ERROR_CODES } from "@todo/shared";
import {
  signUpFormSchema,
  type SignUpFormData,
} from "@/features/auth/schemas/auth.schemas";
import { toast } from "@/components/ui/toast";

export interface PendingVerificationState {
  email: string;
  userId: string;
  password?: string;
}

export function useSignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVerification, setPendingVerification] =
    useState<PendingVerificationState | null>(null);

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleReset = () => {
    setPendingVerification(null);
  };

  const onSubmit = async (data: SignUpFormData) => {
    try {
      setIsLoading(true);
      const res = await authService.signUp({
        email: data.email,
        name: data.name,
        password: data.password,
      });
      setPendingVerification({
        email: data.email,
        userId: res.user.id,
        password: data.password,
      });
      toast.add({
        title: "Account created!",
        description: "Please check your email to verify your account.",
        type: "success",
      });
    } catch (err: unknown) {
      const responseData =
        err && typeof err === "object" && "response" in err
          ? (
              err as {
                response?: { data?: { message?: string; code?: string } };
              }
            ).response?.data
          : undefined;

      const code = responseData?.code;
      const message =
        responseData?.message ||
        (err instanceof Error
          ? err.message
          : "Could not create account. Please try again.");

      if (code === AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS) {
        form.setError("email", {
          type: "manual",
          message: "An account with this email already exists. Please sign in.",
        });
        toast.add({
          title: "Account exists",
          description:
            "An account with this email already exists. Please sign in.",
          type: "error",
        });
      } else {
        toast.add({
          title: "Sign up failed",
          description: message,
          type: "error",
        });
      }
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
    pendingVerification,
    handleReset,
  };
}
