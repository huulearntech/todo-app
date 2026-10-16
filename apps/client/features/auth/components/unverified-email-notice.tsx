import { Button } from "@/components/ui/button";

interface UnverifiedEmailNoticeProps {
  email?: string;
  isResending: boolean;
  onResend: () => void;
}

export function UnverifiedEmailNotice({
  isResending,
  onResend,
}: UnverifiedEmailNoticeProps) {
  return (
    <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-700 dark:text-amber-300 flex flex-col gap-2">
      <p className="font-medium leading-relaxed">
        Your email has not been verified yet. Please check your inbox for the verification link before signing in.
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isResending}
        onClick={onResend}
        className="self-start h-7 text-xs border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15"
      >
        {isResending ? "Sending..." : "Resend verification email"}
      </Button>
    </div>
  );
}
