import * as React from "react";
import Header from "@/components/layout/header";
import { cn } from "@/lib/utils";

export interface StandardPageLayoutProps {
  header?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/**
 * Standard responsive layout for content-focused pages (e.g. Today, Completed, Projects, Labels, Profile, Productivity).
 * Ensures uniform readable container width (max-w-4xl) and consistent responsive padding across the application.
 */
export function StandardPageLayout({
  header = <Header />,
  className,
  children,
}: StandardPageLayoutProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 h-full max-h-full overflow-hidden bg-background text-foreground">
      {header}
      <main className={cn("flex-1 min-h-0 min-w-0 w-full overflow-y-auto", className)}>
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 md:px-8 py-6 md:py-8 flex flex-col gap-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export default StandardPageLayout;
