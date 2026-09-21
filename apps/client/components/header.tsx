"use client";

import Link from "next/link";
import { SidebarTrigger } from "./ui/sidebar";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

import ProjectSearchBar from "./(home)/project-search-bar";

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="px-4 flex h-16 shrink-0 justify-between items-center border-b">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" />
        <ProjectSearchBar />
      </div>
      <div>
        {!user && (
          <Button
            variant="outline"
            className="px-4 py-2 rounded hover:bg-gray-100"
            render={<Link href="/auth" />}
            nativeButton={false}
          >
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
}