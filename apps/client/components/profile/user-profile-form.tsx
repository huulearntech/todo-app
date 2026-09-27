"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { userService } from "@/services/user.service";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";

import {
  updateUserSchema,
  type UpdateUserDto,
  type UserResponseDto,
} from "@todo/shared";

import { toast } from "@/components/ui/toast";

export default function UserProfileForm({ user }: { user: UserResponseDto }) {
  const { control, handleSubmit, reset, formState: { isDirty } } = useForm<UpdateUserDto>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: user.name,
      avatarUrl: user.avatarUrl || "",
    },
  });

  const onSubmit = async (data: UpdateUserDto) => {
    await toast.promise(userService.updateUserProfile(data), {
      loading: "Updating profile...",
      success: "Profile updated successfully!",
      error: (err) => `Error updating profile: ${err.message}`,
    });

    reset(data); // Reset the form with the updated data
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Your Profile</CardTitle>
      </CardHeader>

      <CardContent>


        <form onSubmit={handleSubmit(onSubmit)} id="user-profile-form">
          <FieldGroup>
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input {...field} placeholder="Name" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Field data-disabled>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                placeholder="Email"
                type="email"
                value={user.email}
                readOnly
                disabled
                aria-readonly
              />
            </Field>

          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field
          data-disabled={!isDirty}
          orientation="horizontal"
        >
          <Button
            type="submit"
            form="user-profile-form"
            disabled={!isDirty}
          >
            Update Profile
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}