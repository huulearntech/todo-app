"use client";

import { useForm } from "react-hook-form";
import { useAuth } from "@/providers/AuthProvider";

import { Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/ui/field";

import { toast } from "@/components/ui/toast";


import Link from "next/link";
import { signInSchema, type SignInDto } from "@todo/shared";


export default function SignInForm() {
  const { signIn } = useAuth();

  const form = useForm<SignInDto>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { handleSubmit, formState: { errors } } = form;

  return (
    <form onSubmit={handleSubmit(async (data) => {
      toast.promise(signIn(data), {
        loading: "Signing in...",
        success: "Signed in successfully!",
        error: (err) => `Error signing in: ${err.message}`,
      });
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
      <Button type="submit">Sign In</Button>

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
    </form>
  );
}