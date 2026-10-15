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
    <div className="w-full flex flex-col items-center text-center space-y-16 py-6 sm:py-12">
      {/* Hero Section */}
      <div className="space-y-6 max-w-2xl">
        <h1 className="display-title">
          Organize your work and life, <span className="text-primary">finally.</span>
        </h1>
        <p className="body-muted max-w-xl mx-auto text-balance">
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
        </div>
      </div>

      {/* Feature Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left pt-6 border-t border-border/50">
        <div className="p-5 rounded-xl border border-border/70 bg-card/60 space-y-2.5">
          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <ZapIcon className="size-4.5" />
          </div>
          <h2 className="card-heading">Clear your mind</h2>
          <p className="helper-text leading-relaxed">
            Capture thoughts and tasks the moment they occur so you never lose track of important commitments.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-border/70 bg-card/60 space-y-2.5">
          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <LayersIcon className="size-4.5" />
          </div>
          <h2 className="card-heading">Focus on what matters</h2>
          <p className="helper-text leading-relaxed">
            Organize with Today view, Upcoming horizons, and colour-coded priority flags from P1 to P4.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-border/70 bg-card/60 space-y-2.5">
          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <ShieldCheckIcon className="size-4.5" />
          </div>
          <h2 className="card-heading">Achieve peace of mind</h2>
          <p className="helper-text leading-relaxed">
            Reach inbox zero daily with intuitive task postponement and clean completion workflows.
          </p>
        </div>
      </div>

      {/* Social Proof Stats Banner */}
      <div className="grid grid-cols-3 gap-4 w-full py-6 px-4 rounded-xl border border-border/40 bg-muted/20 text-center">
        <div>
          <div className="stat-value">30M+</div>
          <div className="stat-label">App Downloads</div>
        </div>
        <div>
          <div className="stat-value">2B+</div>
          <div className="stat-label">Tasks Completed</div>
        </div>
        <div>
          <div className="stat-value">99.9%</div>
          <div className="stat-label">Reliable Uptime</div>
        </div>
      </div>
    </div>
  );
}
