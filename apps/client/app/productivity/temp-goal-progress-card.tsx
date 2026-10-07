"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  TargetIcon,
  TrophyIcon,
  CheckCircle2Icon,
  SlidersHorizontalIcon,
  SparklesIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TempCircularProgress } from "./temp-circular-progress-indicator";
import { productivityService } from "@/services/productivity.service";

export default function TempGoalProgressCard() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dailyInput, setDailyInput] = useState<number>(5);
  const [weeklyInput, setWeeklyInput] = useState<number>(20);

  const { data: goals, isLoading } = useQuery({
    queryKey: ["productivity-goals"],
    queryFn: () => productivityService.getGoalProgress(),
  });

  const updateGoalMutation = useMutation({
    mutationFn: productivityService.updateGoals,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productivity-goals"] });
      queryClient.invalidateQueries({ queryKey: ["productivity-history"] });
      setIsDialogOpen(false);
    },
  });

  const handleOpenDialog = () => {
    if (goals) {
      setDailyInput(goals.daily.target);
      setWeeklyInput(goals.weekly.target);
    }
    setIsDialogOpen(true);
  };

  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    if (dailyInput < 1 || weeklyInput < 1) return;
    updateGoalMutation.mutate({
      dailyGoal: dailyInput,
      weeklyGoal: weeklyInput,
    });
  };

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
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Goal Targets
          </h2>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenDialog}
                className="gap-2 cursor-pointer text-xs font-medium"
              />
            }
          >
            <SlidersHorizontalIcon className="size-3.5" />
            Adjust Goals
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Productivity Goals</DialogTitle>
              <DialogDescription>
                Customize your daily and weekly task completion targets. Updates take effect immediately for the current period while protecting your past streak history.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveGoals} className="flex flex-col gap-4 py-3">
              <div className="grid gap-2">
                <Label htmlFor="daily-goal-input">Daily Goal (tasks / day)</Label>
                <Input
                  id="daily-goal-input"
                  type="number"
                  min={1}
                  max={100}
                  value={dailyInput}
                  onChange={(e) => setDailyInput(parseInt(e.target.value, 10) || 1)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="weekly-goal-input">Weekly Goal (tasks / week)</Label>
                <Input
                  id="weekly-goal-input"
                  type="number"
                  min={1}
                  max={500}
                  value={weeklyInput}
                  onChange={(e) => setWeeklyInput(parseInt(e.target.value, 10) || 1)}
                  required
                />
              </div>

              <DialogFooter className="mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateGoalMutation.isPending}
                  className="gap-1.5"
                >
                  {updateGoalMutation.isPending ? "Saving..." : "Save Goals"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daily Goal Card */}
        <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm relative overflow-hidden transition-all hover:border-border">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <TargetIcon className="size-24 text-primary" />
          </div>

          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Daily Goal
              </CardTitle>
              {goals.daily.isAchieved ? (
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 text-xs">
                  <SparklesIcon className="size-3" />
                  Goal Met
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  {dailyRemaining} {dailyRemaining === 1 ? "task" : "tasks"} left
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex items-center gap-5">
              <TempCircularProgress
                size={68}
                strokeWidth={6}
                progress={goals.daily.percentage}
                fillColor={
                  goals.daily.isAchieved
                    ? "stroke-emerald-500"
                    : "stroke-primary"
                }
                icon={
                  goals.daily.isAchieved ? (
                    <CheckCircle2Icon className="size-6 text-emerald-500" />
                  ) : (
                    <span className="text-xs font-bold text-foreground">
                      {Math.round(goals.daily.percentage * 100)}%
                    </span>
                  )
                }
              />

              <div className="flex flex-col">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight text-foreground">
                    {goals.daily.completed}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    / {goals.daily.target} tasks
                  </span>
                </div>
                <CardDescription className="text-xs mt-0.5">
                  {goals.daily.isAchieved
                    ? "Great job! You achieved today's daily target."
                    : `${dailyRemaining} more completed ${dailyRemaining === 1 ? "task" : "tasks"} to reach your goal.`}
                </CardDescription>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Goal Card */}
        <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-sm relative overflow-hidden transition-all hover:border-border">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <TrophyIcon className="size-24 text-primary" />
          </div>

          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Weekly Goal
              </CardTitle>
              {goals.weekly.isAchieved ? (
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 text-xs">
                  <TrophyIcon className="size-3" />
                  Target Smashed
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  {weeklyRemaining} {weeklyRemaining === 1 ? "task" : "tasks"} left
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex items-center gap-5">
              <TempCircularProgress
                size={68}
                strokeWidth={6}
                progress={goals.weekly.percentage}
                fillColor={
                  goals.weekly.isAchieved
                    ? "stroke-emerald-500"
                    : "stroke-chart-2"
                }
                icon={
                  goals.weekly.isAchieved ? (
                    <TrophyIcon className="size-6 text-emerald-500" />
                  ) : (
                    <span className="text-xs font-bold text-foreground">
                      {Math.round(goals.weekly.percentage * 100)}%
                    </span>
                  )
                }
              />

              <div className="flex flex-col">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight text-foreground">
                    {goals.weekly.completed}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    / {goals.weekly.target} tasks
                  </span>
                </div>
                <CardDescription className="text-xs mt-0.5">
                  {goals.weekly.isAchieved
                    ? "Outstanding! You surpassed your weekly completion goal."
                    : `${weeklyRemaining} more completed ${weeklyRemaining === 1 ? "task" : "tasks"} to hit this week's target.`}
                </CardDescription>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
