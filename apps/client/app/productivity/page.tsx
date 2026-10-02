"use client";

import TempCompletedStackedBarChart from "./temp-completed-stacked-bar-chart";
import { useAuth } from "@/providers/AuthProvider";
import { TrendingUpIcon } from "lucide-react";

export default function DailyProductivityPage() {
  const { user } = useAuth();
  const userName = user?.name || user?.email?.split("@")[0] || "there";

  return (
    <div className="w-full flex flex-col gap-6 py-2 pb-12">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <TrendingUpIcon className="size-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Productivity Overview
            </h1>
          </div>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            Nice work, <span className="font-semibold text-foreground">{userName}</span>! Here is your task activity over the last 7 days.
          </p>
        </div>
      </div>

      {/* Main Chart Section */}
      <TempCompletedStackedBarChart />
    </div>
  );
}