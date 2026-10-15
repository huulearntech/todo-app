"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authService } from "@/features/auth/services/auth.service";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import {
  Loader2Icon,
  CheckIcon,
  RotateCcwIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters long")
      .max(100, "New password must be at most 100 characters long"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordFormSchema>;

export default function ChangePasswordCard({ className }: { className?: string }) {
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      const response = await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      toast.add({
        title: "Password updated",
        description: response.message || "Your password has been changed successfully.",
        type: "success",
      });

      reset();
    } catch (err: any) {
      const backendMessage =
        err?.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to change password");

      toast.add({
        title: "Password change error",
        description: typeof backendMessage === "string" ? backendMessage : "Current password does not match.",
        type: "error",
      });
    }
  };

  const handleDiscard = () => {
    reset();
  };

  return (
    <Card
      className={cn(
        "w-full rounded-2xl border border-border/70 bg-card text-card-foreground shadow-xs",
        className
      )}
    >
      <CardHeader className="p-6 pb-2">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <ShieldCheckIcon className="size-5 text-primary" />
          <CardTitle className="text-base font-semibold">Security &amp; Password</CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground mt-1">
          Ensure your account stays secure by using a strong, unique password.
        </CardDescription>
      </CardHeader>

      <form id="change-password-form" onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="p-6 pt-3">
          <FieldGroup className="space-y-4 max-w-md">
            {/* Current Password Field */}
            <Controller
              name="currentPassword"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="space-y-1.5">
                  <FieldLabel
                    htmlFor="currentPassword"
                    className="text-xs font-semibold text-foreground/90"
                  >
                    Current Password
                  </FieldLabel>
                  <InputGroup size="lg" data-invalid={fieldState.invalid}>
                    <InputGroupAddon align="inline-start" className="pl-3 text-muted-foreground">
                      <LockIcon className="size-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                      {...field}
                      id="currentPassword"
                      type={showCurrent ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      disabled={isSubmitting}
                      className="h-full text-sm pl-1 pr-1 placeholder:text-muted-foreground/60"
                    />
                    <InputGroupAddon align="inline-end" className="pr-1.5">
                      <InputGroupButton
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setShowCurrent((prev) => !prev)}
                        className="size-7 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        aria-label={showCurrent ? "Hide password" : "Show password"}
                      >
                        {showCurrent ? (
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

            {/* New Password Field */}
            <Controller
              name="newPassword"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="space-y-1.5">
                  <FieldLabel
                    htmlFor="newPassword"
                    className="text-xs font-semibold text-foreground/90"
                  >
                    New Password
                  </FieldLabel>
                  <InputGroup size="lg" data-invalid={fieldState.invalid}>
                    <InputGroupAddon align="inline-start" className="pl-3 text-muted-foreground">
                      <LockIcon className="size-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                      {...field}
                      id="newPassword"
                      type={showNew ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      className="h-full text-sm pl-1 pr-1 placeholder:text-muted-foreground/60"
                    />
                    <InputGroupAddon align="inline-end" className="pr-1.5">
                      <InputGroupButton
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setShowNew((prev) => !prev)}
                        className="size-7 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        aria-label={showNew ? "Hide password" : "Show password"}
                      >
                        {showNew ? (
                          <EyeOffIcon className="size-3.5" />
                        ) : (
                          <EyeIcon className="size-3.5" />
                        )}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  <p className="text-xs text-muted-foreground leading-normal">
                    Must be at least 8 characters long and different from current password.
                  </p>
                  {fieldState.error && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Confirm New Password Field */}
            <Controller
              name="confirmPassword"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="space-y-1.5">
                  <FieldLabel
                    htmlFor="confirmPassword"
                    className="text-xs font-semibold text-foreground/90"
                  >
                    Confirm New Password
                  </FieldLabel>
                  <InputGroup size="lg" data-invalid={fieldState.invalid}>
                    <InputGroupAddon align="inline-start" className="pl-3 text-muted-foreground">
                      <LockIcon className="size-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                      {...field}
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      className="h-full text-sm pl-1 pr-1 placeholder:text-muted-foreground/60"
                    />
                    <InputGroupAddon align="inline-end" className="pr-1.5">
                      <InputGroupButton
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setShowConfirm((prev) => !prev)}
                        className="size-7 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        aria-label={showConfirm ? "Hide password" : "Show password"}
                      >
                        {showConfirm ? (
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
        </CardContent>

        <CardFooter className="justify-end gap-2 pt-2 border-t border-border/40">
          {isDirty && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDiscard}
              disabled={isSubmitting}
              className="rounded-xl h-9 text-xs font-medium px-3 text-muted-foreground hover:text-foreground gap-1.5"
            >
              <RotateCcwIcon className="size-3.5" />
              Discard
            </Button>
          )}

          <Button
            type="submit"
            disabled={!isDirty || isSubmitting}
            className="rounded-xl h-9 text-xs font-semibold px-4 shadow-xs gap-1.5 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2Icon className="size-3.5 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <CheckIcon className="size-3.5" />
                <span>Update Password</span>
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
