"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordRequestSchema,
  type ForgotPasswordRequestDto,
} from "@todo/shared";
import { requestPasswordResetAction } from "@/features/auth/actions/auth.actions";
import { toast } from "@/components/ui/toast";

export function useForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const form = useForm<ForgotPasswordRequestDto>({
    resolver: zodResolver(forgotPasswordRequestSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordRequestDto) => {
    try {
      setIsLoading(true);
      const result = await requestPasswordResetAction(data.email);

      if (!result.success) {
        toast.add({
          title: "Request failed",
          description: result.message,
          type: "error",
        });
        return;
      }

      setSubmittedEmail(data.email);
      toast.add({
        title: "Reset link sent",
        description: result.message,
        type: "success",
      });
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

  const handleSendAgain = () => {
    setSubmittedEmail(null);
    form.reset();
  };

  return {
    form,
    control: form.control,
    handleSubmit: form.handleSubmit,
    onSubmit,
    isLoading,
    submittedEmail,
    handleSendAgain,
  };
}
