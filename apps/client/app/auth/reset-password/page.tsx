"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ResetPasswordForm from "@/features/auth/components/reset-password-form";
import { Button } from "@/components/ui/button";
import { AlertCircleIcon, ArrowLeftIcon } from "lucide-react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    return (
      <div className="w-full max-w-sm sm:max-w-md mx-auto p-6 rounded-2xl border border-destructive/20 bg-destructive/5 text-center space-y-4">
        <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircleIcon className="size-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">
            Invalid or Missing Reset Token
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The password reset link is invalid, incomplete, or has expired. Please request a new password reset link.
          </p>
        </div>
        <Button
          variant="outline"
          className="rounded-xl text-xs gap-1.5"
          render={<Link href="/auth/forgot-password" />}
          nativeButton={false}
        >
          <ArrowLeftIcon className="size-3.5" />
          <span>Request New Reset Link</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 items-center gap-10 lg:gap-14 xl:gap-20">
      {/* Auth Form Column */}
      <div className="w-full max-w-sm sm:max-w-md mx-auto">
        <ResetPasswordForm token={token} />
      </div>

      {/* Hero Image Column */}
      <div className="hidden lg:flex items-center justify-center w-full max-w-md xl:max-w-lg mx-auto">
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-border/70 shadow-sm bg-muted/20">
          <Image
            src="/images/auth-illustration.jpg"
            alt="Productivity workspace illustration"
            fill
            priority
            className="object-cover"
            sizes="(min-width: 1024px) 512px, 100vw"
          />
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="h-96 w-full max-w-md mx-auto animate-pulse rounded-xl border border-border/60 bg-card/40" />
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
