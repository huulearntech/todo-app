"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, type SignInDto } from "@todo/shared";
import { useAuth } from "@/providers/AuthProvider";
import { signInServerAction, resendVerificationEmailAction } from "@/lib/actions/auth.actions";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { toast } from "@/components/ui/toast";
import {
  Loader2Icon,
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
import { getSafeRedirectUrl } from "@/lib/safe-redirect";

export default function SignInForm({ onSwitchTab }: { onSwitchTab?: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const { handleSubmit, control } = useForm<SignInDto>({
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

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="page-title">
          Sign In
        </h1>
      </div>

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
                <InputGroup
                  size="lg"
                  data-invalid={fieldState.invalid}
                >
                  <InputGroupAddon align="inline-start" className="pl-3 text-muted-foreground">
                    <LockIcon className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    aria-invalid={fieldState.invalid}
                    className="h-full text-sm pl-1 pr-1 placeholder:text-muted-foreground/60"
                    {...field}
                  />
                  <InputGroupAddon align="inline-end" className="pr-1.5">
                    <InputGroupButton
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="size-7 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="size-3.5" />
                      ) : (
                        <EyeIcon className="size-3.5" />
                      )}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
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
        <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-700 dark:text-amber-300 flex flex-col gap-2">
          <p className="font-medium leading-relaxed">
            Your email has not been verified yet. Please check your inbox for the verification link before signing in.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isResending}
            onClick={handleResendVerification}
            className="self-start h-7 text-xs border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15"
          >
            {isResending ? "Sending..." : "Resend verification email"}
          </Button>
        </div>
      )}

      <div className="pt-6 mt-6 border-t border-border/50 text-center">
        <p className="text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          {onSwitchTab ? (
            <button
              type="button"
              onClick={onSwitchTab}
              className="text-primary font-medium hover:underline hover:text-primary/90 cursor-pointer"
            >
              Sign Up
            </button>
          ) : (
            <Link
              href="/auth/sign-up"
              className="text-primary font-medium hover:underline hover:text-primary/90 cursor-pointer"
            >
              Sign Up
            </Link>
          )}
        </p>
      </div>
    </div>
  );
}