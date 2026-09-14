"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { userService } from "@/services/user.service";
import { CreateUserResDto, User } from "@/types/user.type";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Card, CardContent, CardFooter } from "../ui/card";

// TODO: move
const userProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  // avatarUrl: z.url("Invalid URL").optional(),
});

type UserProfileFormData = z.infer<typeof userProfileSchema>;

export default function UserProfileForm({ user }: { user: CreateUserResDto }) {
  const { control, handleSubmit, reset } = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: { // TODO: Default
      name: user.name || "",
      email: user.email || "",
      //avatarUrl: "",
    },
  });

  const onSubmit = async (data: UserProfileFormData) => {
    try {
      console.log("Submitting user profile data:", data);
      // TODO: Propriate schema for updateUserProfile
      const updatedUser: User = await userService.updateUserProfile(data as User);
      console.log("User profile updated:", updatedUser);
      reset(updatedUser); // Reset the form with the updated user data
    } catch (error) {
      console.error("Error updating user profile:", error);
    }
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

            <Controller
              name="email"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input {...field} placeholder="Email" type="email" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

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