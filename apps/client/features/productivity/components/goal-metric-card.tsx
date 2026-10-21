"use client";

import { CheckCircle2Icon, TargetIcon, TrophyIcon, SparklesIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CircularProgressIndicator } from "@/features/productivity/components/circular-progress-indicator";

export interface GoalProgressItem {
  completed: number;
  target: number;
  ratio: number;
  isAchieved: boolean;
}

export interface GoalMetricCardProps {
  type: "daily" | "weekly";
  goal: GoalProgressItem;
}

export function GoalMetricCard({ type, goal }: GoalMetricCardProps) {
  const { completed, target, ratio, isAchieved } = goal;
  const isDaily = type === "daily";
  const title = isDaily ? "Daily Goal" : "Weekly Goal";
  const BackgroundIcon = isDaily ? TargetIcon : TrophyIcon;
  const achievedBadgeText = isDaily ? "Goal Met" : "Weekly Met";
  const remaining = Math.max(0, target - completed);
  const achievedDescription = isDaily
    ? "Great job! You achieved today's daily target."
    : "Awesome achievement! You met your weekly target.";
  const unachievedDescription = `${remaining} more completed ${
    remaining === 1 ? "task" : "tasks"
  } to reach your goal.`;

  return (
    <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm relative overflow-hidden transition-all hover:border-border">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <BackgroundIcon className="size-24 text-primary" />
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {isAchieved ? (
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 text-xs">
              <SparklesIcon className="size-3" />
              {achievedBadgeText}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              {remaining} {remaining === 1 ? "task" : "tasks"} left
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-5">
          <CircularProgressIndicator
            size={68}
            strokeWidth={6}
            progress={ratio}
            fillColor={isAchieved ? "stroke-emerald-500" : "stroke-primary"}
            icon={
              isAchieved ? (
                <CheckCircle2Icon className="size-6 text-emerald-500" />
              ) : (
                <span className="text-xs font-bold text-foreground">
                  {Math.round(ratio * 100)}%
                </span>
              )
            }
          />

          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="stat-value">{completed}</span>
              <span className="stat-label">/ {target} tasks</span>
            </div>
            <CardDescription className="card-subheading mt-0.5">
              {isAchieved ? achievedDescription : unachievedDescription}
            </CardDescription>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
