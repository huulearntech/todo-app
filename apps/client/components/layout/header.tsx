"use client";

import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import GlobalSearchBar from "@/features/search/components/global-search-bar";
import { CheckSquareIcon } from "lucide-react";

export interface HeaderProps {
  /** Custom left content, e.g. Breadcrumbs. If not provided, shows GlobalSearchBar for authenticated users */
  left?: React.ReactNode;
  /** Custom right content, e.g. action buttons or dropdown menus */
  right?: React.ReactNode;
  /** Whether to show the Sign In button for unauthenticated users. Defaults to true. */
  showAuthAction?: boolean;
}

export default function Header({ left, right, showAuthAction = true }: HeaderProps) {
  const { user } = useAuth();

  // Unauthenticated header: No search bar or sidebar toggle; show branding and auth action
  if (!user) {
    return (
      <header className="px-4 flex h-16 shrink-0 justify-between items-center border-b border-border/60 sticky top-0 z-10 bg-card">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold text-base tracking-tight text-foreground hover:opacity-90 transition-opacity"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <CheckSquareIcon className="size-4.5 stroke-[2.2]" />
          </div>
          <span>Todo</span>
        </Link>
        <div className="flex items-center gap-2">
          {right}
          {showAuthAction && (
            <Button
              variant="outline"
              className="px-4 py-2 rounded-lg hover:bg-muted"
              render={<Link href="/auth/sign-in" />}
              nativeButton={false}
            >
              Sign In
            </Button>
          )}
        </div>
      </header>
    );
  }

  // Authenticated header
  return (
    <header className="px-4 flex h-16 shrink-0 justify-between items-center border-b border-border/60 sticky top-0 z-10 bg-card">
      <div className="flex items-center gap-2.5 flex-1 max-w-lg min-w-0">
        <SidebarTrigger className="-ml-1 shrink-0" />
        <Separator orientation="vertical" />
        {left ? (
          <div className="min-w-0 flex-1">{left}</div>
        ) : (
          <GlobalSearchBar />
        )}
      </div>
      {right && <div className="flex items-center gap-2 shrink-0">{right}</div>}
    </header>
  );
}