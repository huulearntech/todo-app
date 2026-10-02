"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authService } from "@/services/auth.service";
import { signUpSchema, type SignUpDto } from "@todo/shared";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Loader2Icon, MailIcon, LockIcon, UserIcon, UserPlusIcon } from "lucide-react";

export default function SignUpForm({ onSwitchTab }: { onSwitchTab?: () => void }) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignUpDto>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
    },
  });

  const { handleSubmit } = form;

  const onSubmit = async (data: SignUpDto) => {
    try {
      setIsLoading(true);
      await authService.signUp(data);
      toast.add({
        title: "Sign up successful!",
        description: "Your account has been created. You can now sign in.",
        type: "success",
      });
      if (onSwitchTab) {
        onSwitchTab();
      }
    } catch (error) {
      toast.add({
        title: "Sign up failed",
        description: "Could not create account. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full border border-border/80 shadow-md rounded-2xl bg-card/95 backdrop-blur-xs">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <UserPlusIcon className="size-5 text-primary" />
          Create Account
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm text-muted-foreground">
          Fill in your details below to get started with Todo.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <form id="sign-up-form" onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="space-y-3.5">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="name" className="text-xs font-semibold">
                    Full Name
                  </FieldLabel>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      autoComplete="name"
                      className="pl-9 rounded-xl h-10 border-border/70 focus-visible:ring-primary/40 text-sm"
                      {...field}
                    />
                  </div>
                  {fieldState.error && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="email" className="text-xs font-semibold">
                    Email Address
                  </FieldLabel>
                  <div className="relative">
                    <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      autoComplete="email"
                      className="pl-9 rounded-xl h-10 border-border/70 focus-visible:ring-primary/40 text-sm"
                      {...field}
                    />
                  </div>
                  {fieldState.error && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="password" className="text-xs font-semibold">
                    Password
                  </FieldLabel>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                      className="pl-9 rounded-xl h-10 border-border/70 focus-visible:ring-primary/40 text-sm"
                      {...field}
                    />
                  </div>
                  {fieldState.error && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-4 pb-6 border-t border-border/40 bg-muted/20 rounded-b-2xl">
        <Button
          type="submit"
          form="sign-up-form"
          disabled={isLoading}
          className="w-full h-10 rounded-xl font-semibold shadow-xs gap-2"
        >
          {isLoading ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            <span>Create Account</span>
          )}
        </Button>

        {onSwitchTab && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onSwitchTab}
              className="text-primary font-semibold hover:underline cursor-pointer"
            >
              Sign In
            </button>
          </p>
        )}
      </CardFooter>
    </Card>
  );
}