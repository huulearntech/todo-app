"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userService } from "@/services/user.service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  updateUserSchema,
  type UpdateUserDto,
  type UserResponseDto,
} from "@todo/shared";
import { toast } from "@/components/ui/toast";
import {
  UserIcon,
  MailIcon,
  LockIcon,
  Loader2Icon,
  CheckIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface UserProfileFormProps {
  user: UserResponseDto;
  onUserUpdated?: (updated: UserResponseDto) => void;
  className?: string;
}

export default function UserProfileForm({
  user,
  onUserUpdated,
  className,
}: UserProfileFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<UpdateUserDto>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: user.name,
      avatarUrl: user.avatarUrl ?? "",
    },
  });

  // Re-sync form default values if user prop updates
  React.useEffect(() => {
    reset({
      name: user.name,
      avatarUrl: user.avatarUrl ?? "",
    });
  }, [user, reset]);

  const onSubmit = async (data: UpdateUserDto) => {
    try {
      const response = await userService.updateUserProfile({
        name: data.name,
      });

      toast.add({
        title: "Profile updated",
        description: "Your personal details have been saved successfully.",
        type: "success",
      });

      reset(data);
      if (response && response.data) {
        onUserUpdated?.(response.data);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update profile";
      toast.add({
        title: "Update error",
        description: message,
        type: "error",
      });
    }
  };

  const handleDiscard = () => {
    reset({
      name: user.name,
      avatarUrl: user.avatarUrl ?? "",
    });
  };

  return (
    <Card
      className={cn(
        "w-full rounded-2xl border border-border/70 bg-card text-card-foreground shadow-xs",
        className
      )}
    >
      <CardHeader className="space-y-1.5 pb-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <UserIcon className="size-4" />
          </div>
          <CardTitle className="text-base font-semibold tracking-tight text-foreground">
            Personal Details
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Update your public display name and view your registered account details.
        </CardDescription>
      </CardHeader>

      <form id="user-profile-form" onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-5 pt-6">
          <FieldGroup className="space-y-4">
            {/* Display Name Field */}
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="space-y-1.5">
                  <FieldLabel
                    htmlFor="name"
                    className="text-xs font-semibold text-foreground flex items-center justify-between"
                  >
                    <span>Full Name</span>
                    <span className="text-[11px] font-normal text-muted-foreground">
                      Required
                    </span>
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      {...field}
                      id="name"
                      placeholder="e.g. Alex Morgan"
                      disabled={isSubmitting}
                      className="h-10 rounded-xl border-border/70 bg-background/80 px-3.5 text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-primary/40"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    This is the name visible on your tasks, assigned sections, and projects.
                  </p>
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Email Address Field (Read-only) */}
            <Field data-disabled className="space-y-1.5">
              <FieldLabel
                htmlFor="email"
                className="text-xs font-semibold text-foreground flex items-center justify-between"
              >
                <span>Email Address</span>
                <Badge
                  variant="secondary"
                  className="text-[10px] h-4.5 px-2 py-0 gap-1 rounded-full font-medium text-muted-foreground bg-muted"
                >
                  <LockIcon className="size-2.5" />
                  Primary
                </Badge>
              </FieldLabel>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  readOnly
                  disabled
                  aria-readonly="true"
                  className="h-10 rounded-xl border-border/50 bg-muted/40 font-mono text-xs cursor-not-allowed opacity-80"
                />
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal flex items-center gap-1.5">
                <ShieldCheckIcon className="size-3.5 text-emerald-500 shrink-0" />
                Email address is tied to your account login and cannot be altered directly.
              </p>
            </Field>
          </FieldGroup>
        </CardContent>

        <CardFooter className="flex items-center justify-between pt-4 pb-5 border-t border-border/40 gap-3">
          <div className="text-xs text-muted-foreground hidden sm:block">
            {isDirty ? (
              <span className="text-amber-500 font-medium">
                You have unsaved changes
              </span>
            ) : (
              <span>All changes saved</span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {isDirty && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
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
              size="sm"
              disabled={!isDirty || isSubmitting}
              className="rounded-xl h-9 text-xs font-semibold px-4 shadow-xs gap-1.5 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="size-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="size-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}