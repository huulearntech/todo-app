import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2Icon } from "lucide-react";

interface ForgotPasswordSuccessNoticeProps {
  email: string;
  onSendAgain: () => void;
}

export function ForgotPasswordSuccessNotice({
  email,
  onSendAgain,
}: ForgotPasswordSuccessNoticeProps) {
  return (
    <div className="w-full space-y-6">
      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 flex items-start gap-3">
        <CheckCircle2Icon className="size-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
        <div className="space-y-1 text-xs leading-relaxed">
          <p className="font-semibold text-sm text-emerald-900 dark:text-emerald-200">
            Check your inbox
          </p>
          <p>
            If an account is associated with <span className="font-semibold">{email}</span>, you will receive an email with instructions to reset your password.
          </p>
          <p className="text-muted-foreground pt-1">
            The link expires in 15 minutes. Be sure to check your spam or junk folder if you don&apos;t see it within a few moments.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onSendAgain}
          className="w-full h-10 rounded-xl text-xs font-medium"
        >
          Try another email
        </Button>
        <Button
          className="w-full h-10 rounded-xl text-xs font-medium"
          render={<Link href="/auth/sign-in" />}
          nativeButton={false}
        >
          Return to Sign In
        </Button>
      </div>
    </div>
  );
}
