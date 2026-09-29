"use client";

import { useForm } from "react-hook-form";
import { useAuth } from "@/providers/AuthProvider";

import { Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";

import { toast } from "@/components/ui/toast";


import Link from "next/link";
import { signInSchema, type SignInDto } from "@todo/shared";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";


export default function SignInForm() {
  const { signIn } = useAuth();

  const { handleSubmit, control } = useForm<SignInDto>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInDto) => {
    try {
      await signIn(data);
      toast.add({
        title: "Signed in successfully!",
        type: "success",
      });
    } catch (error) {
      toast.add({
        title: "Error signing in",
        description: "An unexpected error occurred.",
        type: "error",
      });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to sign in to your account.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form id="sign-in-form" onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
          <Controller
            name="email"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" type="email" {...field} />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="password"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input id="password" type="password" {...field} />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          </FieldGroup>
        </form>
      </CardContent>

      <CardFooter className="bg-inherit">
        <Field>
          <Button type="submit" form="sign-in-form">Sign In</Button>

          <p className="text-sm">
            Don't have an account?{" "}
            <Link href="/auth/sign-up" className="text-blue-500 hover:underline">
              Register here
            </Link>
          </p>
          <p className="text-sm">
            Forgot your password?{" "}
            <Link href="/auth/forgot-password" className="text-blue-500 hover:underline">
              Reset it here
            </Link>
          </p>

        </Field>
      </CardFooter>

    </Card>
  );
}