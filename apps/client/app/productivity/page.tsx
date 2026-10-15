"use client";

import CompletedStackedBarChart from "@/features/productivity/components/completed-stacked-bar-chart";
import GoalProgressCard from "@/features/productivity/components/goal-progress-card";
import { useAuth } from "@/providers/AuthProvider";
import { TrendingUpIcon } from "lucide-react";

export default function DailyProductivityPage() {
  const { user } = useAuth();
  const userName = user?.name || user?.email?.split("@")[0] || "there";

  return (
    <div className="w-full section-stack">
      {/* Hero Header */}
      <div className="page-header-row">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <TrendingUpIcon className="size-5" />
            </div>
            <h1 className="page-title">
              Productivity Overview
            </h1>
          </div>
          <p className="page-subtitle">
            Nice work, <span className="font-semibold text-foreground">{userName}</span>! Here is your task activity over the last 7 days.
          </p>
        </div>
      </div>

      {/* Goal Targets Section */}
      <GoalProgressCard />

      {/* Main Chart Section */}
      <CompletedStackedBarChart />
    </div>
  );
}