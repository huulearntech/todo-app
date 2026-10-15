"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordRequestSchema,
  type ForgotPasswordRequestDto,
} from "@todo/shared";
import { requestPasswordResetAction } from "@/features/auth/actions/auth.actions";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { toast } from "@/components/ui/toast";
import {
  Loader2Icon,
  MailIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
} from "lucide-react";

export default function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const { handleSubmit, control, reset } = useForm<ForgotPasswordRequestDto>({
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
    reset();
  };

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

      {submittedEmail ? (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 flex items-start gap-3">
            <CheckCircle2Icon className="size-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <div className="space-y-1 text-xs leading-relaxed">
              <p className="font-semibold text-sm text-emerald-900 dark:text-emerald-200">
                Check your inbox
              </p>
              <p>
                If an account is associated with <span className="font-semibold">{submittedEmail}</span>, you will receive an email with instructions to reset your password.
              </p>
              <p className="text-muted-foreground pt-1">
                The link expires in 15 minutes. Be sure to check your spam or junk folder if you don&apos;t see it within a few moments.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleSendAgain}
              className="w-full h-10 rounded-xl text-xs font-medium"
            >
              Try another email
            </Button>
            <Button
              className="w-full h-10 rounded-xl text-xs font-medium"
              render={<Link href="/auth/sign-in" />}
              nativeButton={false}
            >
              Return to Sign In
            </Button>
          </div>
        </div>
      ) : (
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

          <div className="pt-4 text-center">
            <Link
              href="/auth/sign-in"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer"
            >
              <ArrowLeftIcon className="size-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
