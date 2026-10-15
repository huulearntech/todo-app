import * as React from "react";
import Header from "@/components/layout/header";
import { cn } from "@/lib/utils";

export interface FullSpaceLayoutProps {
  header?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/**
 * Full-space layout for workspace canvases (Kanban & Calendar).
 * Provides 100% of available viewport space below the header without artificial max-width constraints.
 */
export function FullSpaceLayout({
  header = <Header />,
  className,
  children,
}: FullSpaceLayoutProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 h-full max-h-full overflow-hidden bg-background text-foreground">
      {header}
      <div className={cn("flex-1 min-h-0 min-w-0 h-full w-full overflow-hidden flex flex-col", className)}>
        {children}
      </div>
    </div>
  );
}

export default FullSpaceLayout;
