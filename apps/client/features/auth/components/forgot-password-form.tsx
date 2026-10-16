"use client";

import Link from "next/link";
import { Controller } from "react-hook-form";
import { useForgotPasswordForm } from "@/features/auth/hooks/use-forgot-password-form";
import { ForgotPasswordSuccessNotice } from "./forgot-password-success-notice";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Loader2Icon, MailIcon, ArrowLeftIcon } from "lucide-react";

export default function ForgotPasswordForm() {
  const {
    control,
    handleSubmit,
    onSubmit,
    isLoading,
    submittedEmail,
    handleSendAgain,
  } = useForgotPasswordForm();

  if (submittedEmail) {
    return (
      <div className="w-full">
        <div className="mb-6">
          <h1 className="page-title">
            Check Your Email
          </h1>
          <p className="page-subtitle mt-1">
            We sent a password reset link to your email address.
          </p>
        </div>
        <ForgotPasswordSuccessNotice
          email={submittedEmail}
          onSendAgain={handleSendAgain}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="page-title">
          Forgot Password
        </h1>
        <p className="page-subtitle mt-1">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <form id="forgot-password-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FieldGroup className="space-y-4">
          <Controller
            name="email"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="email" className="text-xs font-semibold text-foreground/90">
                  Email Address
                </FieldLabel>
                <InputGroup
                  size="lg"
                  data-invalid={fieldState.invalid}
                >
                  <InputGroupAddon align="inline-start" className="pl-3 text-muted-foreground">
                    <MailIcon className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    aria-invalid={fieldState.invalid}
                    className="h-full text-sm pl-1 placeholder:text-muted-foreground/60"
                    {...field}
                  />
                </InputGroup>
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>

        <Button
          type="submit"
          form="forgot-password-form"
          disabled={isLoading}
          className="w-full h-10 rounded-xl font-medium shadow-xs hover:shadow-sm active:translate-y-px transition-all gap-2"
        >
          {isLoading ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              <span>Sending Reset Link...</span>
            </>
          ) : (
            <span>Send Reset Link</span>
          )}
        </Button>

        <Link
          href="/auth/sign-in"
          className="flex items-center justify-center gap-1.5 pt-4 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer"
        >
          <ArrowLeftIcon className="size-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </form>
    </div>
  );
}
