"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/providers/AuthProvider";
import { signInSchema, type SignInDto } from "@todo/shared";

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
import { Loader2Icon, MailIcon, LockIcon, LogInIcon } from "lucide-react";

export default function SignInForm({ onSwitchTab }: { onSwitchTab?: () => void }) {
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const { handleSubmit, control } = useForm<SignInDto>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInDto) => {
    try {
      setIsLoading(true);
      await signIn(data);
      toast.add({
        title: "Signed in successfully!",
        description: "Welcome back!",
        type: "success",
      });
    } catch (error) {
      toast.add({
        title: "Error signing in",
        description: "Invalid email or password. Please try again.",
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
          <LogInIcon className="size-5 text-primary" />
          Sign In
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm text-muted-foreground">
          Enter your email and password to access your account.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <form id="sign-in-form" onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="space-y-3.5">
            <Controller
              name="email"
              control={control}
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
              control={control}
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
                      placeholder="••••••••"
                      autoComplete="current-password"
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
          form="sign-in-form"
          disabled={isLoading}
          className="w-full h-10 rounded-xl font-semibold shadow-xs gap-2"
        >
          {isLoading ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </Button>

        {onSwitchTab && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={onSwitchTab}
              className="text-primary font-semibold hover:underline cursor-pointer"
            >
              Register here
            </button>
          </p>
        )}
      </CardFooter>
    </Card>
  );
}