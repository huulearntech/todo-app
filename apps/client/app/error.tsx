"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircleIcon, RotateCcwIcon, HomeIcon, WifiOffIcon } from "lucide-react";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log non-sensitive diagnostic info
    console.error("Route error boundary caught error:", error.message);
  }, [error]);

  const lowerMsg = error.message.toLowerCase();
  const isCorruptedAccount = lowerMsg.includes("corrupted");
  const isNetworkIssue =
    lowerMsg.includes("network") ||
    lowerMsg.includes("failed to fetch") ||
    lowerMsg.includes("unable to connect");

  return (
    <div className="flex-1 min-h-[60vh] flex items-center justify-center p-4 sm:p-6">
      <Card className="max-w-md w-full rounded-2xl border border-destructive/20 bg-card p-6 sm:p-8 text-center shadow-xs space-y-5">
        <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          {isNetworkIssue ? (
            <WifiOffIcon className="size-6" />
          ) : (
            <AlertCircleIcon className="size-6" />
          )}
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {isCorruptedAccount
              ? "Account Setup Required"
              : isNetworkIssue
                ? "Connection Problem"
                : "Something Went Wrong"}
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isCorruptedAccount
              ? "Your account configuration is missing required workspace settings. Please try signing out and signing in again, or contact support."
              : isNetworkIssue
                ? "Unable to reach the server. Please check your network connection and retry."
                : "An unexpected error occurred while loading this page. You can try refreshing or returning to the dashboard."}
          </p>
          {error.digest && (
            <p className="text-[10px] text-muted-foreground/60 font-mono">
              Ref: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={reset}
            className="w-full sm:w-auto rounded-xl gap-2 text-xs font-semibold cursor-pointer"
          >
            <RotateCcwIcon className="size-3.5" />
            <span>Try Again</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto rounded-xl gap-2 text-xs font-medium cursor-pointer"
            render={<Link href="/" />}
            nativeButton={false}
          >
            <HomeIcon className="size-3.5" />
            <span>Home</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
