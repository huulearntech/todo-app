"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, type SignInDto } from "@todo/shared";
import { useAuth } from "@/providers/AuthProvider";
import { signInServerAction } from "@/lib/actions/auth.actions";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { toast } from "@/components/ui/toast";
import {
  Loader2Icon,
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";

function getSafeRedirectUrl(target: string | null, fallback = "/"): string {
  if (!target) return fallback;
  if (target.startsWith("/") && !target.startsWith("//")) {
    return target;
  }
  return fallback;
}

export default function SignInForm({ onSwitchTab }: { onSwitchTab?: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      const result = await signInServerAction(data);

      if (!result.success) {
        toast.add({
          title: "Error signing in",
          description: result.error,
          type: "error",
        });
        return;
      }

      // 1. Update AuthProvider user state
      setUser(result.user);

      // 2. Display success toast
      toast.add({
        title: "Signed in successfully!",
        description: "Welcome back!",
        type: "success",
      });

      // 3. Navigate to destination or homepage
      const redirectParam = searchParams.get("redirect");
      const destination = getSafeRedirectUrl(redirectParam, "/");

      router.push(destination);
      router.refresh();
    } catch {
      toast.add({
        title: "Error signing in",
        description: "An unexpected error occurred. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Sign In
        </h1>
      </div>

      <form id="sign-in-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FieldGroup className="space-y-4">
          <Controller
            name="email"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="email" className="text-xs font-semibold text-foreground/90">
                  Email Address
                </FieldLabel>
                <InputGroup
                  data-invalid={fieldState.invalid}
                  className="h-10 rounded-lg border-border/80 bg-background transition-colors hover:border-border focus-within:border-primary/80 focus-within:ring-2 focus-within:ring-primary/20"
                >
                  <InputGroupAddon align="inline-start" className="pl-3 text-muted-foreground">
                    <MailIcon className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    aria-invalid={fieldState.invalid}
                    className="h-full text-sm pl-1 placeholder:text-muted-foreground/60"
                    {...field}
                  />
                </InputGroup>
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="password"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="password" className="text-xs font-semibold text-foreground/90">
                  Password
                </FieldLabel>
                <InputGroup
                  data-invalid={fieldState.invalid}
                  className="h-10 rounded-lg border-border/80 bg-background transition-colors hover:border-border focus-within:border-primary/80 focus-within:ring-2 focus-within:ring-primary/20"
                >
                  <InputGroupAddon align="inline-start" className="pl-3 text-muted-foreground">
                    <LockIcon className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    aria-invalid={fieldState.invalid}
                    className="h-full text-sm pl-1 pr-1 placeholder:text-muted-foreground/60"
                    {...field}
                  />
                  <InputGroupAddon align="inline-end" className="pr-1.5">
                    <InputGroupButton
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="size-7 rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="size-3.5" />
                      ) : (
                        <EyeIcon className="size-3.5" />
                      )}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>

        <Button
          type="submit"
          form="sign-in-form"
          disabled={isLoading}
          className="w-full h-10 rounded-lg font-medium shadow-xs hover:shadow-sm active:translate-y-px transition-all gap-2"
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
      </form>

      <div className="pt-6 mt-6 border-t border-border/50 text-center">
        <p className="text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          {onSwitchTab ? (
            <button
              type="button"
              onClick={onSwitchTab}
              className="text-primary font-medium hover:underline hover:text-primary/90 cursor-pointer"
            >
              Sign Up
            </button>
          ) : (
            <Link
              href="/auth/sign-up"
              className="text-primary font-medium hover:underline hover:text-primary/90 cursor-pointer"
            >
              Sign Up
            </Link>
          )}
        </p>
      </div>
    </div>
  );
}