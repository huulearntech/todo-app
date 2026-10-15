"use client";

import { useState } from "react";
import { useProductivityGoals } from "@/features/productivity/hooks/use-productivity-goals";
import {
  TargetIcon,
  TrophyIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GoalMetricCard } from "./goal-metric-card";
import { EditGoalsDialog } from "./edit-goals-dialog";

export default function GoalProgressCard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: goals, isLoading } = useProductivityGoals();

  if (isLoading || !goals) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
      </div>
    );
  }

  const dailyRemaining = Math.max(0, goals.daily.target - goals.daily.completed);
  const weeklyRemaining = Math.max(0, goals.weekly.target - goals.weekly.completed);

  return (
    <div className="flex flex-col gap-4">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TargetIcon className="size-5 text-primary" />
          <h2 className="section-title">
            Goal Targets
          </h2>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDialogOpen(true)}
          className="gap-2 cursor-pointer text-xs font-medium"
        >
          <SlidersHorizontalIcon className="size-3.5" />
          Adjust Goals
        </Button>

        <EditGoalsDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          defaultDailyTarget={goals.daily.target}
          defaultWeeklyTarget={goals.weekly.target}
        />
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GoalMetricCard
          title="Daily Goal"
          backgroundIcon={TargetIcon}
          completed={goals.daily.completed}
          target={goals.daily.target}
          ratio={goals.daily.ratio}
          isAchieved={goals.daily.isAchieved}
          achievedBadgeText="Goal Met"
          achievedBadgeIcon={SparklesIcon}
          achievedDescription="Great job! You achieved today's daily target."
          unachievedDescription={`${dailyRemaining} more completed ${dailyRemaining === 1 ? "task" : "tasks"} to reach your goal.`}
        />

        <GoalMetricCard
          title="Weekly Goal"
          backgroundIcon={TrophyIcon}
          completed={goals.weekly.completed}
          target={goals.weekly.target}
          ratio={goals.weekly.ratio}
          isAchieved={goals.weekly.isAchieved}
          achievedBadgeText="Target Smashed"
          achievedBadgeIcon={TrophyIcon}
          achievedDescription="Outstanding! You crushed this week's productivity goal."
          unachievedDescription={`${weeklyRemaining} more completed ${weeklyRemaining === 1 ? "task" : "tasks"} to reach your goal.`}
        />
      </div>
    </div>
  );
}
