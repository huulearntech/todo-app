"use client";

import Link from "next/link";
import { SidebarTrigger } from "./ui/sidebar";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

import GlobalSearchBar from "./search/global-search-bar";

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="px-4 flex h-16 shrink-0 justify-between items-center border-b sticky top-0 z-10 bg-card">
      <div className="flex items-center gap-2 flex-1 max-w-lg">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" />
        <GlobalSearchBar />
      </div>
      <div>
        {!user && (
          <Button
            variant="outline"
            className="px-4 py-2 rounded hover:bg-gray-100"
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