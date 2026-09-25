"use client";

import { useForm } from "react-hook-form";
import { authService } from "@/services/auth.service";

import { Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FieldGroup,
  FieldLabel,
  Field,
  FieldError,
} from "@/components/ui/field";


import Link from "next/link";

import { signUpSchema, type SignUpDto } from "@todo/shared";
import { Loader2Icon } from "lucide-react";
import { toast } from "@/components/ui/toast";


export default function SignUpForm() {
  const form = useForm<SignUpDto>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
    },
  });

  const { handleSubmit, formState: { isLoading } } = form;

  const onSubmit = (data: SignUpDto) => toast.promise(authService.signUp(data), {
    loading: "Signing up...",
    success: "Sign up successful! Please check your email to verify your account.",
    error: "Sign up failed. Please try again."
  });

    

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
      <Controller
        name="email"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" type="email" {...field} />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input id="name" type="text" {...field} />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="password"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input id="password" type="password" {...field} />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      </FieldGroup>

      <Button type="submit" data-disabled={isLoading}>
        {isLoading ?
          <>
            <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            Signing Up...
          </>
          : "Sign Up"
        }
      </Button>

      <p className="mt-4 text-sm">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="text-blue-500 hover:underline">
          Sign In
        </Link>
      </p>
    </form>
  );
}