"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/providers/AuthProvider";
import { verifyMagicLinkAction } from "@/lib/actions/auth.actions";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const token = searchParams.get("token");

  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(
    !token ? "No verification token provided. Please check your email link." : null
  );
  const [isSuccess, setIsSuccess] = useState(false);

  const handleVerify = async () => {
    if (!token) return;
    setIsVerifying(true);
    setError(null);

    const result = await verifyMagicLinkAction(token);
    setIsVerifying(false);

    if (result.success && result.user) {
      setIsSuccess(true);
      setUser(result.user);
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } else {
      setError(result.error || "Failed to verify email. The link may have expired or already been used.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="w-full shadow-lg border border-border/80">
        <CardHeader className="text-center space-y-2">
          {isSuccess ? (
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          ) : error ? (
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-2">
              <AlertCircle className="w-6 h-6" />
            </div>
          ) : (
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          )}
          <CardTitle className="text-2xl font-bold tracking-tight">
            {isSuccess
              ? "Email Verified!"
              : error
              ? "Verification Issue"
              : "Verify Your Account"}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {isSuccess
              ? "Your email has been confirmed. Redirecting to your dashboard..."
              : error
              ? error
              : "Click the button below to confirm your email and log in to your account."}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center space-y-4">
          {!isSuccess && !error && (
            <Button
              className="w-full py-6 text-base font-semibold shadow-md transition-all"
              onClick={handleVerify}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Confirm Verification
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          )}

          {isSuccess && (
            <div className="flex items-center text-sm text-emerald-600 font-medium">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Taking you to your workspace...
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-center border-t border-border/50 pt-4">
          <Link
            href="/auth/sign-in"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to Sign In
          </Link>
        </CardFooter>
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
