"use client";

import { useAuth } from "@/providers/AuthProvider.draft";
import Link from "next/link";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import ProjectSearchBar from "@/components/(home)/project-search-bar";


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Ellipsis, Heart, Pencil, Trash } from "lucide-react";

export default function Header() {
  const { user } = useAuth();

  if (!user) {
    return null // TODO: handle properly
  }

  return (
    <header className="px-4 flex h-16 shrink-0 justify-between items-center border-b">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <ProjectSearchBar />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className="relative h-8 w-8 rounded-full">
          <Ellipsis />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Heart className="mr-2 h-4 w-4" />
              Favorite
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem variant="destructive">
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}