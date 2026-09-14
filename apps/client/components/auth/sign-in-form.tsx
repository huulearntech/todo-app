"use client";

import { useForm } from "react-hook-form";
import { authService } from "@/services/auth.service";

import { z } from "zod";
import { Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/ui/field";


import Link from "next/link";

// TODO: move
const signInFormSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export default function SignInForm() {
  const form = useForm<z.infer<typeof signInFormSchema>>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { handleSubmit, formState: { errors } } = form;

  return (
    <form onSubmit={handleSubmit(async (data) => {
      try {
        const response = await authService.login(data);
        console.log("Login successful:", response); // TODO: toast
      } catch (error) {
        console.error("Login failed:", error);
      }
    })}>
      <Controller
        name="email"
        control={form.control}
        render={({ field }) => (
          <div className="mb-4">
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" type="email" {...field} />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>
        )}
      />
      <Controller
        name="password"
        control={form.control}
        render={({ field }) => (
          <div className="mb-4">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input id="password" type="password" {...field} />
            {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
          </div>
        )}
      />
      <Button type="submit">Login</Button>
        <p className="text-sm">
          Don't have an account?{" "}
          <Link href="/auth/register" className="text-blue-500 hover:underline">
            Register here
          </Link>
        </p>
        <p className="text-sm">
          Forgot your password?{" "}
          <Link href="/auth/forgot-password" className="text-blue-500 hover:underline">
            Reset it here
          </Link>
        </p>
    </form>
  );
}