import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2Icon, ArrowRightIcon } from "lucide-react";

export function ResetPasswordSuccessNotice() {
  return (
    <div className="w-full space-y-6">
      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 flex items-start gap-3">
        <CheckCircle2Icon className="size-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
        <div className="space-y-1 text-xs leading-relaxed">
          <p className="font-semibold text-sm text-emerald-900 dark:text-emerald-200">
            Password successfully reset
          </p>
          <p>
            Your account has been updated with your new password. All prior sessions have been securely signed out.
          </p>
          <p className="text-muted-foreground pt-1">
            Redirecting you to the Sign In page...
          </p>
        </div>
      </div>

      <Button
        className="w-full h-10 rounded-xl font-medium gap-2"
        render={<Link href="/auth/sign-in" />}
        nativeButton={false}
      >
        <span>Continue to Sign In</span>
        <ArrowRightIcon className="size-4" />
      </Button>
    </div>
  );
}
