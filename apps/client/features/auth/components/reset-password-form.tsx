"use client";

import { Controller } from "react-hook-form";
import { useResetPasswordForm } from "@/features/auth/hooks/use-reset-password-form";
import { ResetPasswordSuccessNotice } from "./reset-password-success-notice";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Loader2Icon } from "lucide-react";

interface ResetPasswordFormProps {
  token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const {
    control,
    handleSubmit,
    onSubmit,
    isLoading,
    isSuccess,
  } = useResetPasswordForm({ token });

  if (isSuccess) {
    return <ResetPasswordSuccessNotice />;
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="page-title">
          Reset Password
        </h1>
        <p className="page-subtitle mt-1">
          Choose a strong, secure new password for your account.
        </p>
      </div>

      <form id="reset-password-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FieldGroup className="space-y-4">
          <Controller
            name="newPassword"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="newPassword" className="text-xs font-semibold text-foreground/90">
                  New Password
                </FieldLabel>
                <PasswordInput
                  {...field}
                  id="newPassword"
                  autoComplete="new-password"
                  dataInvalid={fieldState.invalid}
                  disabled={isLoading}
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="confirmPassword"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="confirmPassword" className="text-xs font-semibold text-foreground/90">
                  Confirm New Password
                </FieldLabel>
                <PasswordInput
                  {...field}
                  id="confirmPassword"
                  autoComplete="new-password"
                  dataInvalid={fieldState.invalid}
                  disabled={isLoading}
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>

        <Button
          type="submit"
          form="reset-password-form"
          disabled={isLoading}
          className="w-full h-10 rounded-xl font-medium shadow-xs hover:shadow-sm active:translate-y-px transition-all gap-2"
        >
          {isLoading ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              <span>Resetting Password...</span>
            </>
          ) : (
            <span>Reset Password</span>
          )}
        </Button>
      </form>
    </div>
  );
}
