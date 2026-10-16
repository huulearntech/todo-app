"use client";

import Link from "next/link";
import { Controller } from "react-hook-form";
import { useSignUpForm } from "@/features/auth/hooks/use-sign-up-form";
import CheckEmailNotice from "./check-email-notice";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Loader2Icon,
  MailIcon,
  UserIcon,
} from "lucide-react";

export default function SignUpForm() {
  const {
    control,
    handleSubmit,
    onSubmit,
    isLoading,
    pendingVerification,
    handleReset,
  } = useSignUpForm();

  if (pendingVerification) {
    return (
      <CheckEmailNotice
        email={pendingVerification.email}
        userId={pendingVerification.userId}
        credentials={
          pendingVerification.password
            ? {
                email: pendingVerification.email,
                password: pendingVerification.password,
              }
            : undefined
        }
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="w-full">
      <h1 className="page-title mb-6">
        Sign Up
      </h1>

      <form id="sign-up-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FieldGroup className="space-y-4">
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="name" className="text-xs font-semibold text-foreground/90">
                  Full Name
                </FieldLabel>
                <InputGroup
                  size="lg"
                  data-invalid={fieldState.invalid}
                >
                  <InputGroupAddon align="inline-start" className="pl-3 text-muted-foreground">
                    <UserIcon className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    autoComplete="name"
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
                <FieldLabel htmlFor="password" className="text-xs font-semibold text-foreground/90">
                  Password
                </FieldLabel>
                <PasswordInput
                  {...field}
                  id="password"
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
                <FieldLabel
                  htmlFor="confirmPassword"
                  className="text-xs font-semibold text-foreground/90"
                >
                  Confirm Password
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

        <p className="text-[11px] text-muted-foreground/80 leading-normal">
          By signing up, you agree to Todo&apos;s Terms of Service and Privacy Policy.
        </p>

        <Button
          type="submit"
          form="sign-up-form"
          disabled={isLoading}
          className="w-full h-10 rounded-xl font-medium shadow-xs hover:shadow-sm active:translate-y-px transition-all gap-2"
        >
          {isLoading ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              <span>Signing Up...</span>
            </>
          ) : (
            <span>Sign Up</span>
          )}
        </Button>
      </form>

      <p className="pt-6 mt-6 border-t border-border/50 text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/auth/sign-in"
          className="text-primary font-medium hover:underline hover:text-primary/90 cursor-pointer"
        >
          Sign In
        </Link>
      </p>
    </div>
  );
}