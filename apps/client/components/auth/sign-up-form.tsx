"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authService } from "@/services/auth.service";
import { signUpSchema, type SignUpDto } from "@todo/shared";

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
  UserIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";

export default function SignUpForm({ onSwitchTab }: { onSwitchTab?: () => void }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignUpDto>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
    },
  });

  const { handleSubmit, control } = form;

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
      } else {
        router.push("/auth/sign-in");
      }
    } catch {
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
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Sign Up
        </h1>
      </div>

      <form id="sign-up-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FieldGroup className="space-y-4">
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="name" className="text-xs font-semibold text-foreground/90">
                  Full Name
                </FieldLabel>
                <InputGroup
                  data-invalid={fieldState.invalid}
                  className="h-10 rounded-lg border-border/80 bg-background transition-colors hover:border-border focus-within:border-primary/80 focus-within:ring-2 focus-within:ring-primary/20"
                >
                  <InputGroupAddon align="inline-start" className="pl-3 text-muted-foreground">
                    <UserIcon className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    autoComplete="name"
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
                    autoComplete="new-password"
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

        <p className="text-[11px] text-muted-foreground/80 leading-normal">
          By signing up, you agree to Todo&apos;s Terms of Service and Privacy Policy.
        </p>

        <Button
          type="submit"
          form="sign-up-form"
          disabled={isLoading}
          className="w-full h-10 rounded-lg font-medium shadow-xs hover:shadow-sm active:translate-y-px transition-all gap-2"
        >
          {isLoading ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              <span>Signing Up...</span>
            </>
          ) : (
            <span>Sign Up</span>
          )}
        </Button>
      </form>

      <div className="pt-6 mt-6 border-t border-border/50 text-center">
        <p className="text-xs text-muted-foreground">
          Already have an account?{" "}
          {onSwitchTab ? (
            <button
              type="button"
              onClick={onSwitchTab}
              className="text-primary font-medium hover:underline hover:text-primary/90 cursor-pointer"
            >
              Sign In
            </button>
          ) : (
            <Link
              href="/auth/sign-in"
              className="text-primary font-medium hover:underline hover:text-primary/90 cursor-pointer"
            >
              Sign In
            </Link>
          )}
        </p>
      </div>
    </div>
  );
}