"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { userService } from "@/services/user.service";
import { CreateUserResDto, User } from "@/types/user.type";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Card, CardContent, CardFooter } from "../ui/card";

import { updateUserProfileSchema, type UpdateUserProfileDto } from "@todo/shared";

import { toast } from "@/components/ui/toast";

export default function UserProfileForm({ user }: { user: CreateUserResDto }) {
  const { control, handleSubmit, reset } = useForm<UpdateUserProfileDto>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      name: user.name || "",
      avatarUrl: user.avatarUrl || "",
    },
  });

  // TODO: mutate user tanstack query cache.
  const onSubmit = async (data: UpdateUserProfileDto) => {
    toast.promise(userService.updateUserProfile(data), {
      loading: "Updating profile...",
      success: "Profile updated successfully!",
      error: "Failed to update profile.",
    });
  };

  return (
    <Card>
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

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input placeholder="Email" type="email" value={user.email} readOnly aria-readonly />
            </Field>

          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button variant="secondary" onClick={() => reset()}>
            Reset
          </Button>
        </Field>
        <Field orientation="horizontal">
          <Button type="submit" form="user-profile-form">Update Profile</Button>
        </Field>
      </CardFooter>
    </Card>
  );
}