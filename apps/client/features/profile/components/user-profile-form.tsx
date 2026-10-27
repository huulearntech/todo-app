"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userService } from "@/features/profile/services/user.service";
import Avatar from "@/features/profile/components/avatar";
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
} from "@/components/ui/card";
import {
  updateUserSchema,
  type UpdateUserDto,
  type UserResponseDto,
} from "@todo/shared";
import { toast } from "@/components/ui/toast";
import {
  Loader2Icon,
  CheckIcon,
  RotateCcwIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

export interface UserProfileFormProps {
  user: UserResponseDto;
  className?: string;
}

export default function UserProfileForm({
  user,
  className,
}: UserProfileFormProps) {
  const { updateUser } = useAuth();
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
        updateUser(response.data);
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
      <form id="user-profile-form" onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
            {/* Avatar: Centered on mobile/narrow, left-aligned on desktop/wide */}
            <div className="shrink-0 flex justify-center">
              <Avatar
                avatarUrl={user.avatarUrl ?? undefined}
                name={user.name}
                onAvatarUpdated={(url) => {
                  updateUser({ avatarUrl: url });
                }}
              />
            </div>

            {/* Form Fields */}
            <div className="flex-1 w-full">
              <FieldGroup className="space-y-4">
                {/* Display Name Field */}
                <Controller
                  name="name"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="space-y-1.5">
                      <FieldLabel
                        htmlFor="name"
                        className="text-sm font-medium text-foreground"
                      >
                        Full Name
                      </FieldLabel>
                      <Input
                        {...field}
                        id="name"
                        placeholder="e.g. Alex Morgan"
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-muted-foreground leading-normal">
                        This is your display name visible across projects and tasks.
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
                    className="text-sm font-medium text-foreground"
                  >
                    Email Address
                  </FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    readOnly
                    disabled
                    aria-readonly="true"
                    className="text-sm cursor-not-allowed opacity-80"
                  />
                  <p className="text-xs text-muted-foreground leading-normal">
                    Email address cannot be changed
                  </p>
                </Field>
              </FieldGroup>
            </div>
          </div>
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
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckIcon className="size-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}