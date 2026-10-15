"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SunIcon,
  MoonIcon,
  LaptopIcon,
  CheckIcon,
} from "lucide-react";

export function NavUserThemeSubmenu() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="rounded-lg gap-2 cursor-pointer">
        {mounted && resolvedTheme === "dark" ? (
          <MoonIcon className="size-4 text-muted-foreground" />
        ) : (
          <SunIcon className="size-4 text-muted-foreground" />
        )}
        <span>Theme</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="min-w-36 rounded-xl p-1 shadow-md border-border/60">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="flex items-center justify-between gap-2 rounded-lg cursor-pointer text-xs px-2.5 py-1.5"
        >
          <div className="flex items-center gap-2">
            <SunIcon className="size-3.5 text-muted-foreground" />
            <span>Light</span>
          </div>
          {mounted && theme === "light" && (
            <CheckIcon className="size-3.5 text-primary" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="flex items-center justify-between gap-2 rounded-lg cursor-pointer text-xs px-2.5 py-1.5"
        >
          <div className="flex items-center gap-2">
            <MoonIcon className="size-3.5 text-muted-foreground" />
            <span>Dark</span>
          </div>
          {mounted && theme === "dark" && (
            <CheckIcon className="size-3.5 text-primary" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="flex items-center justify-between gap-2 rounded-lg cursor-pointer text-xs px-2.5 py-1.5"
        >
          <div className="flex items-center gap-2">
            <LaptopIcon className="size-3.5 text-muted-foreground" />
            <span>System</span>
          </div>
          {mounted && theme === "system" && (
            <CheckIcon className="size-3.5 text-primary" />
          )}
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
