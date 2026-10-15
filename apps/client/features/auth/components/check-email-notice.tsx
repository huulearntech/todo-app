"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/features/auth/services/auth.service";
import { useVerificationListener } from "@/features/auth/hooks/use-verification-listener";
import { useAuth } from "@/providers/AuthProvider";
import { signInServerAction } from "@/features/auth/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  MailIcon,
  Loader2Icon,
  CheckCircle2Icon,
  RefreshCwIcon,
  RotateCcwIcon,
} from "lucide-react";

interface CheckEmailNoticeProps {
  email: string;
  userId: string;
  credentials?: { email: string; password: string };
  onReset?: () => void;
}

export default function CheckEmailNotice({
  email,
  userId,
  credentials,
  onReset,
}: CheckEmailNoticeProps) {
  const router = useRouter();
  const { setUser } = useAuth();
  const [cooldown, setCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  const { status } = useVerificationListener({
    userId,
    onVerified: async () => {
      if (credentials) {
        try {
          const result = await signInServerAction(credentials);
          if (result.success && result.user) {
            setUser(result.user);
            toast.add({
              title: "Email verified",
              description: "Welcome to Todo App!",
              type: "success",
            });
            router.push("/");
            router.refresh();
            return;
          }
        } catch {
          // Ignore
        }
      }

      toast.add({
        title: "Email verified",
        description: "Your account has been verified.",
        type: "success",
      });
    },
  });

  // 60-second cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;

    try {
      setIsResending(true);
      const res = await authService.resendVerificationEmail(email);
      setCooldown(60);
      toast.add({
        title: "Email sent",
        description:
          res.message || "A new verification email has been sent.",
        type: "success",
      });
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : err instanceof Error
            ? err.message
            : "Could not send verification email. Please try again later.";

      toast.add({
        title: "Unable to resend",
        description: message || "Please wait before requesting another email.",
        type: "error",
      });
    } finally {
      setIsResending(false);
    }
  };

  const isVerified = status === "verified";

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-border/70 bg-card/60 p-6 sm:p-8 backdrop-blur-xs shadow-xs text-center space-y-6">
        {/* Subtle status icon */}
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {isVerified ? (
            <CheckCircle2Icon className="size-6 text-emerald-600 dark:text-emerald-400 stroke-[2.2]" />
          ) : (
            <MailIcon className="size-6 stroke-[2.2]" />
          )}
        </div>

        {/* Heading and copy */}
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {isVerified ? "Email verified" : "Verify your email"}
          </h1>
          {isVerified ? (
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Your account has been verified. Redirecting to your workspace...
            </p>
          ) : (
            <div className="space-y-1 text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              <p>
                We sent a verification email to{" "}
                <strong className="text-foreground font-medium break-all">
                  {email}
                </strong>
                .
              </p>
              <p className="text-xs text-muted-foreground/80">
                Didn&apos;t receive it? Check your spam folder or resend below.
              </p>
            </div>
          )}
        </div>

        {/* Action Controls - only rendered while waiting for verification */}
        {!isVerified && (
          <div className="space-y-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={handleResend}
              disabled={cooldown > 0 || isResending}
              className="w-full h-10 rounded-xl text-xs sm:text-sm font-medium border-border/80 hover:bg-muted/60 transition-colors gap-2"
            >
              {isResending ? (
                <>
                  <Loader2Icon className="size-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : cooldown > 0 ? (
                <span>Resend email in {cooldown}s</span>
              ) : (
                <>
                  <RefreshCwIcon className="size-3.5" />
                  <span>Resend email</span>
                </>
              )}
            </Button>

            {onReset && (
              <div>
                <button
                  type="button"
                  onClick={onReset}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <RotateCcwIcon className="size-3" />
                  <span>Use a different email address</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
