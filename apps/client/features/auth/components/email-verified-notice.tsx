import { CheckCircle2Icon } from "lucide-react";

export function EmailVerifiedNotice() {
  return (
    <div className="w-full rounded-2xl border border-border/70 bg-card/60 p-6 sm:p-8 backdrop-blur-xs shadow-xs text-center space-y-6">
      <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <CheckCircle2Icon className="size-6 text-emerald-600 dark:text-emerald-400 stroke-[2.2]" />
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Email verified
        </h1>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Your account has been verified. Redirecting to your workspace...
        </p>
      </div>
    </div>
  );
}
