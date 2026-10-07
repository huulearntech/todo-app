import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRightIcon,
  ZapIcon,
  LayersIcon,
  ShieldCheckIcon,
} from "lucide-react";

export default function LandingHome() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col items-center text-center space-y-16">
      {/* Hero Section */}
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground text-balance">
          Organize your work and life, <span className="text-primary">finally.</span>
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground text-balance leading-relaxed">
          Simplify your day, reduce mental clutter, and achieve peace of mind with a fast, focused task manager designed for clarity.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            size="lg"
            className="w-full sm:w-auto h-11 px-6 rounded-lg font-medium shadow-xs gap-2"
            render={<Link href="/auth/sign-up" />}
            nativeButton={false}
          >
            <span>Start for free</span>
            <ArrowRightIcon className="size-4" />
          </Button>
          {/* <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto h-11 px-6 rounded-lg font-medium"
            render={<Link href="/auth/sign-in" />}
            nativeButton={false}
          >
            Sign In
          </Button> */}
        </div>
      </div>

      {/* Feature Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left pt-6 border-t border-border/50">
        <div className="p-5 rounded-xl border border-border/70 bg-card/60 space-y-2.5">
          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <ZapIcon className="size-4.5" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Clear your mind</h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Capture thoughts and tasks the moment they occur so you never lose track of important commitments.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-border/70 bg-card/60 space-y-2.5">
          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <LayersIcon className="size-4.5" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Focus on what matters</h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Organize with Today view, Upcoming horizons, and colour-coded priority flags from P1 to P4.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-border/70 bg-card/60 space-y-2.5">
          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <ShieldCheckIcon className="size-4.5" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Achieve peace of mind</h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Reach inbox zero daily with intuitive task postponement and clean completion workflows.
          </p>
        </div>
      </div>

      {/* Social Proof Stats Banner */}
      <div className="grid grid-cols-3 gap-4 w-full py-6 px-4 rounded-xl border border-border/40 bg-muted/20 text-center">
        <div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">30M+</div>
          <div className="text-[11px] sm:text-xs text-muted-foreground">App Downloads</div>
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">2B+</div>
          <div className="text-[11px] sm:text-xs text-muted-foreground">Tasks Completed</div>
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">99.9%</div>
          <div className="text-[11px] sm:text-xs text-muted-foreground">Reliable Uptime</div>
        </div>
      </div>
    </div>
  );
}
