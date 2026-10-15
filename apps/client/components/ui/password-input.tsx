"use client";

import * as React from "react";
import { LockIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

export interface PasswordInputProps
  extends Omit<React.ComponentProps<typeof InputGroupInput>, "type"> {
  groupSize?: "sm" | "default" | "lg";
  dataInvalid?: boolean;
}

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  PasswordInputProps
>(function PasswordInput(
  {
    groupSize = "lg",
    dataInvalid,
    className,
    placeholder = "••••••••",
    disabled,
    ...props
  },
  ref
) {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <InputGroup size={groupSize} data-invalid={dataInvalid}>
      <InputGroupAddon align="inline-start" className="pl-3 text-muted-foreground">
        <LockIcon className="size-4" />
      </InputGroupAddon>
      <InputGroupInput
        ref={ref}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={dataInvalid || props["aria-invalid"]}
        className={cn(
          "h-full text-sm pl-1 pr-1 placeholder:text-muted-foreground/60",
          className
        )}
        {...props}
      />
      <InputGroupAddon align="inline-end" className="pr-1.5">
        <InputGroupButton
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={disabled}
          onClick={() => setShowPassword((prev) => !prev)}
          className="size-7 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
  );
});
PasswordInput.displayName = "PasswordInput";
