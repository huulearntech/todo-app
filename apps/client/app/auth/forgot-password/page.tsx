"use client";

import { Suspense, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import ForgotPasswordForm from "@/components/auth/forgot-password-form";

function ForgotPasswordContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  if (!isLoading && user) {
    return null;
  }

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 items-center gap-10 lg:gap-14 xl:gap-20">
      {/* Auth Form Column */}
      <div className="w-full max-w-sm sm:max-w-md mx-auto">
        <ForgotPasswordForm />
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

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="h-96 w-full max-w-md mx-auto animate-pulse rounded-xl border border-border/60 bg-card/40" />
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
