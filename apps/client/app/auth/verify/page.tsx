"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { verifyMagicLinkAction } from "@/features/auth/actions/auth.actions";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isVerifying, setIsVerifying] = useState(Boolean(token));
  const [error, setError] = useState<string | null>(
    !token ? "This verification link is invalid or missing." : null
  );
  const [isSuccess, setIsSuccess] = useState(false);
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    if (!token || hasRequestedRef.current) return;
    hasRequestedRef.current = true;

    setIsVerifying(true);
    setError(null);

    verifyMagicLinkAction(token).then((result) => {
      setIsVerifying(false);

      if (result.success) {
        setIsSuccess(true);
      } else {
        setError(
          result.error || "This link has expired or has already been used."
        );
      }
    });
  }, [token]);

  return (
    <div className="w-full max-w-md mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="w-full shadow-lg border border-border/80">
        <CardHeader className="text-center space-y-2">
          {isVerifying ? (
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : isSuccess ? (
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          ) : (
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-2">
              <AlertCircle className="w-6 h-6" />
            </div>
          )}

          <CardTitle className="text-2xl font-bold tracking-tight">
            {isVerifying
              ? "Verifying email..."
              : isSuccess
              ? "Email verified"
              : "Verification failed"}
          </CardTitle>

          <CardDescription className="text-sm text-muted-foreground">
            {isVerifying
              ? "Please wait while we confirm your account."
              : isSuccess
              ? "Your email has been confirmed. You can close this window and continue in your original browser."
              : error}
          </CardDescription>
        </CardHeader>

        {error && (
          <CardContent className="flex flex-col items-center">
            <Button
              variant="outline"
              className="w-full py-5 text-sm font-medium gap-2"
              render={<Link href="/auth/sign-in" />}
              nativeButton={false}
            >
              <span>Back to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md mx-auto h-72 animate-pulse rounded-xl border border-border/60 bg-card/40" />
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
