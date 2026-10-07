"use client";

import { Suspense, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import SignInForm from "@/components/auth/sign-in-form";

function getSafeRedirectUrl(target: string | null, fallback = "/"): string {
  if (!target) return fallback;
  if (target.startsWith("/") && !target.startsWith("//")) {
    return target;
  }
  return fallback;
}

function SignInContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading && user) {
      const redirectParam = searchParams.get("redirect");
      const destination = getSafeRedirectUrl(redirectParam, "/");
      router.replace(destination);
    }
  }, [user, isLoading, router, searchParams]);

  if (!isLoading && user) {
    return null;
  }

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 items-center gap-10 lg:gap-14 xl:gap-20">
      {/* Auth Form Column: Centered on screen (< 1024px), side by side (>= 1024px) */}
      <div className="w-full max-w-sm sm:max-w-md mx-auto">
        <SignInForm />
      </div>

      {/* Hero Image Column: Visible on width >= 1024px (lg), hidden on width < 1024px */}
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

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="h-96 w-full max-w-md mx-auto animate-pulse rounded-xl border border-border/60 bg-card/40" />}>
      <SignInContent />
    </Suspense>
  );
}
