"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SunIcon, MoonIcon, LaptopIcon, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  align?: "start" | "end" | "center";
}

export function ThemeToggle({ className, align = "end" }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(props) => (
          <Button
            {...props}
            variant="ghost"
            size="icon-sm"
            aria-label="Toggle theme"
            className={cn(
              "size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors shrink-0",
              className
            )}
          >
            {mounted ? (
              resolvedTheme === "dark" ? (
                <MoonIcon className="size-4 transition-transform duration-200" />
              ) : (
                <SunIcon className="size-4 transition-transform duration-200" />
              )
            ) : (
              <span className="size-4" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        )}
      />
      <DropdownMenuContent
        align={align}
        className="min-w-36 rounded-xl p-1 shadow-md border-border/60"
      >
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ThemeToggle;
