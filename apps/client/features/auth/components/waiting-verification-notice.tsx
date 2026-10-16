import { Button } from "@/components/ui/button";
import {
  MailIcon,
  Loader2Icon,
  RefreshCwIcon,
  RotateCcwIcon,
} from "lucide-react";

interface WaitingVerificationNoticeProps {
  email: string;
  cooldown: number;
  isResending: boolean;
  onResend: () => void;
  onReset?: () => void;
}

export function WaitingVerificationNotice({
  email,
  cooldown,
  isResending,
  onResend,
  onReset,
}: WaitingVerificationNoticeProps) {
  return (
    <div className="w-full rounded-2xl border border-border/70 bg-card/60 p-6 sm:p-8 backdrop-blur-xs shadow-xs text-center space-y-6">
      <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <MailIcon className="size-6 stroke-[2.2]" />
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Verify your email
        </h1>
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
      </div>

      <div className="space-y-3 pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={onResend}
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
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <RotateCcwIcon className="size-3" />
            <span>Use a different email address</span>
          </button>
        )}
      </div>
    </div>
  );
}
