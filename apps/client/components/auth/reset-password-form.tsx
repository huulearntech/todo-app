"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { resetPasswordAction } from "@/lib/actions/auth.actions";

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
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  CheckCircle2Icon,
  ArrowRightIcon,
} from "lucide-react";

const clientResetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(100, "Password must be at most 100 characters long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ClientResetPasswordFormData = z.infer<typeof clientResetPasswordSchema>;

interface ResetPasswordFormProps {
  token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { handleSubmit, control } = useForm<ClientResetPasswordFormData>({
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

  if (isSuccess) {
    return (
      <div className="w-full space-y-6">
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 flex items-start gap-3">
          <CheckCircle2Icon className="size-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          <div className="space-y-1 text-xs leading-relaxed">
            <p className="font-semibold text-sm text-emerald-900 dark:text-emerald-200">
              Password successfully reset
            </p>
            <p>
              Your account has been updated with your new password. All prior sessions have been securely signed out.
            </p>
            <p className="text-muted-foreground pt-1">
              Redirecting you to the Sign In page...
            </p>
          </div>
        </div>

        <Button
          className="w-full h-10 rounded-xl font-medium gap-2"
          render={<Link href="/auth/sign-in" />}
          nativeButton={false}
        >
          <span>Continue to Sign In</span>
          <ArrowRightIcon className="size-4" />
        </Button>
      </div>
    );
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
                <InputGroup
                  size="lg"
                  data-invalid={fieldState.invalid}
                >
                  <InputGroupAddon align="inline-start" className="pl-3 text-muted-foreground">
                    <LockIcon className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                    className="h-full text-sm pl-1 pr-1 placeholder:text-muted-foreground/60"
                    {...field}
                  />
                  <InputGroupAddon align="inline-end" className="pr-1.5">
                    <InputGroupButton
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="size-7 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? (
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

          <Controller
            name="confirmPassword"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="confirmPassword" className="text-xs font-semibold text-foreground/90">
                  Confirm New Password
                </FieldLabel>
                <InputGroup
                  size="lg"
                  data-invalid={fieldState.invalid}
                >
                  <InputGroupAddon align="inline-start" className="pl-3 text-muted-foreground">
                    <LockIcon className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                    className="h-full text-sm pl-1 pr-1 placeholder:text-muted-foreground/60"
                    {...field}
                  />
                  <InputGroupAddon align="inline-end" className="pr-1.5">
                    <InputGroupButton
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="size-7 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
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
