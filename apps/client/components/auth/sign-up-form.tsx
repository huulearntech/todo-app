"use client";

import { useForm } from "react-hook-form";
import { authService } from "@/services/auth.service";

import { z } from "zod";
import { Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FieldGroup, FieldLabel, Field } from "@/components/ui/field";


import Link from "next/link";

// TODO: move
const signUpFormSchema = z.object({
  email: z.email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export default function SignUpForm() {
  const form = useForm<z.infer<typeof signUpFormSchema>>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
    },
  });

  const { handleSubmit, formState: { errors } } = form;

  return (
    <form onSubmit={handleSubmit(async (data) => {
      try {
        const response = await authService.register(data);
        console.log("Sign up successful:", response);
      } catch (error) {
        console.error("Sign up failed:", error);
      }
    })}>
      <FieldGroup>
      <Controller
        name="email"
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" type="email" {...field} />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </Field>
        )}
      />
      <Controller
        name="name"
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input id="name" type="text" {...field} />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </Field>
        )}
      />
      <Controller
        name="password"
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input id="password" type="password" {...field} />
            {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
          </Field>
        )}
      />

      </FieldGroup>
      <Button type="submit">Sign Up</Button>
      <p className="mt-4 text-sm">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-blue-500 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}