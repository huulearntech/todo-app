"use client";

import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { PaintbrushIcon, SunIcon, MoonIcon, LaptopIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const currentTheme = theme || "system";

  return (
    <Card className="rounded-2xl border border-border/70 bg-card text-card-foreground shadow-xs">
      <CardHeader className="space-y-1 pb-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <PaintbrushIcon className="size-4" />
          </div>
          <CardTitle className="text-base font-semibold tracking-tight text-foreground">
            Appearance
          </CardTitle>
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          Customize the interface theme across your devices.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <RadioGroup
          value={currentTheme}
          onValueChange={(val) => setTheme(val)}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3.5"
        >
          {[
            {
              id: "light",
              title: "Light",
              desc: "Bright & crisp",
              icon: SunIcon,
            },
            {
              id: "dark",
              title: "Dark",
              desc: "Calm & easy on the eyes",
              icon: MoonIcon,
            },
            {
              id: "system",
              title: "System",
              desc: "Matches your device setting",
              icon: LaptopIcon,
            },
          ].map((option) => {
            const isSelected = currentTheme === option.id;
            const Icon = option.icon;

            return (
              <Label
                key={option.id}
                htmlFor={`theme-${option.id}`}
                className={cn(
                  "flex flex-col items-start p-4 rounded-xl border transition-all cursor-pointer select-none",
                  isSelected
                    ? "border-primary bg-primary/5 text-foreground shadow-xs ring-1 ring-primary/20"
                    : "border-border/70 hover:border-border hover:bg-muted/40 text-muted-foreground"
                )}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <RadioGroupItem value={option.id} id={`theme-${option.id}`} />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {option.title}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  {option.desc}
                </span>
              </Label>
            );
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}

export function AppearanceSkeleton() {
  return (
    <Card className="rounded-2xl border border-border/60 p-6 space-y-4">
      <div className="space-y-1.5 pb-4 border-b border-border/40">
        <div className="h-5 w-32 rounded-md bg-muted/60 animate-pulse" />
        <div className="h-4 w-56 rounded-md bg-muted/40 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
        <div className="h-28 rounded-xl bg-muted/30 animate-pulse" />
        <div className="h-28 rounded-xl bg-muted/30 animate-pulse" />
        <div className="h-28 rounded-xl bg-muted/30 animate-pulse" />
      </div>
    </Card>
  );
}
