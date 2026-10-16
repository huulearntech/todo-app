"use client";

import Link from "next/link";
import { Controller } from "react-hook-form";
import { useSignInForm } from "@/features/auth/hooks/use-sign-in-form";
import { UnverifiedEmailNotice } from "./unverified-email-notice";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { PasswordInput } from "@/components/ui/password-input";
import { Loader2Icon, MailIcon } from "lucide-react";

export default function SignInForm() {
  const {
    control,
    handleSubmit,
    onSubmit,
    isLoading,
    unverifiedEmail,
    isResending,
    handleResendVerification,
  } = useSignInForm();

  return (
    <div className="w-full">
      <h1 className="page-title mb-6">
        Sign In
      </h1>

      <form id="sign-in-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

          <Controller
            name="password"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="password" className="text-xs font-semibold text-foreground/90">
                    Password
                  </FieldLabel>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-primary hover:underline font-medium cursor-pointer"
                  >
                    Forgot password?
                  </Link>
                </div>
                <PasswordInput
                  {...field}
                  id="password"
                  autoComplete="current-password"
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
          form="sign-in-form"
          disabled={isLoading}
          className="w-full h-10 rounded-xl font-medium shadow-xs hover:shadow-sm active:translate-y-px transition-all gap-2"
        >
          {isLoading ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </Button>
      </form>

      {unverifiedEmail && (
        <UnverifiedEmailNotice
          email={unverifiedEmail}
          isResending={isResending}
          onResend={handleResendVerification}
        />
      )}

      <p className="pt-6 mt-6 border-t border-border/50 text-center text-xs text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/sign-up"
          className="text-primary font-medium hover:underline hover:text-primary/90 cursor-pointer"
        >
          Sign Up
        </Link>
      </p>
    </div>
  );
}