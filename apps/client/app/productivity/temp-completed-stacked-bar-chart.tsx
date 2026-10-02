"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { useQuery } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { CheckCircle2Icon, CalendarIcon, FolderIcon, ZapIcon } from "lucide-react";

// Distinct harmonious palette for projects (light & dark mode compatible)
const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "oklch(0.556 0 0)", // Muted slate for "Other"
];

export default function TempCompletedStackedBarChart() {
  const { data, isLoading } = useQuery({
    queryKey: ["completed-tasks-last-7-days"],
    queryFn: taskService.getMyTasksCompletedInLast7Days,
    select: (tasks) => {
      // 1. Initialize the last 7 days excluding current day (today), ordered chronologically
      const today = new Date();
      const past7Days: { dateString: string; dayName: string; displayLabel: string }[] = [];
      const dateMap: Record<string, Record<string, number>> = {};

      for (let i = 7; i >= 1; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const dateString = `${year}-${month}-${day}`;

        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
        const displayLabel = date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });

        past7Days.push({ dateString, dayName, displayLabel });
        dateMap[dateString] = {};
      }

      // 2. Count completions by Project Name across these 7 days
      const projectCounts: Record<string, number> = {};
      let totalCompletedIn7Days = 0;

      tasks.forEach((task) => {
        if (!task.completedAt) return;
        const taskDate = new Date(task.completedAt);
        const year = taskDate.getFullYear();
        const month = String(taskDate.getMonth() + 1).padStart(2, "0");
        const day = String(taskDate.getDate()).padStart(2, "0");
        const completedDateStr = `${year}-${month}-${day}`;

        if (dateMap[completedDateStr]) {
          totalCompletedIn7Days++;
          const projectName = task.section?.project?.name || "General";
          projectCounts[projectName] = (projectCounts[projectName] || 0) + 1;
        }
      });

      // 3. Find Top 5 Projects
      const sortedProjects = Object.entries(projectCounts).sort((a, b) => b[1] - a[1]);
      const top5Projects = sortedProjects.slice(0, 5).map(([name]) => name);

      const otherCount = sortedProjects.slice(5).reduce((sum, [, count]) => sum + count, 0);
      const hasOther = otherCount > 0;

      const categories = top5Projects.length > 0
        ? (hasOther ? [...top5Projects, "Other"] : top5Projects)
        : ["Tasks Completed"];

      // Ensure dateMap has default 0 entries for categories
      Object.keys(dateMap).forEach((dateStr) => {
        categories.forEach((cat) => {
          dateMap[dateStr][cat] = 0;
        });
      });

      // 4. Fill tasks into category buckets for each date
      tasks.forEach((task) => {
        if (!task.completedAt) return;
        const taskDate = new Date(task.completedAt);
        const year = taskDate.getFullYear();
        const month = String(taskDate.getMonth() + 1).padStart(2, "0");
        const day = String(taskDate.getDate()).padStart(2, "0");
        const completedDateStr = `${year}-${month}-${day}`;

        if (dateMap[completedDateStr]) {
          const projectName = task.section?.project?.name || "General";
          const category = top5Projects.includes(projectName)
            ? projectName
            : (hasOther ? "Other" : categories[0]);

          if (dateMap[completedDateStr][category] !== undefined) {
            dateMap[completedDateStr][category] += 1;
          }
        }
      });

      // 5. Build final chartData preserving 7-day chronological order
      const chartData = past7Days.map((item) => {
        const counts = dateMap[item.dateString] || {};
        const total = Object.values(counts).reduce((sum, val) => sum + val, 0);
        return {
          date: item.dateString,
          dayName: item.dayName,
          displayLabel: item.displayLabel,
          ...counts,
          total,
        };
      });

      const mostActiveProject = sortedProjects.length > 0 ? sortedProjects[0][0] : "—";
      const dailyAverage = (totalCompletedIn7Days / 7).toFixed(1);

      return {
        chartData,
        categories,
        totalCompletedIn7Days,
        mostActiveProject,
        dailyAverage,
      };
    },
  });

  // Chart configuration for shadcn/chart
  const chartConfig: ChartConfig = useMemo(() => {
    if (!data?.categories) return {};

    const config: ChartConfig = {};
    data.categories.forEach((cat, idx) => {
      const color = CHART_COLORS[idx % CHART_COLORS.length];
      const safeKey = cat.replace(/[^a-zA-Z0-9_-]/g, "_");

      config[cat] = {
        label: cat,
        color: color,
      };
      if (safeKey !== cat) {
        config[safeKey] = {
          label: cat,
          color: color,
        };
      }
    });
    return config;
  }, [data?.categories]);

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-[420px] w-full rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="w-full p-8 text-center text-muted-foreground">
        No completed task data available.
      </Card>
    );
  }

  const { chartData, categories, totalCompletedIn7Days, mostActiveProject, dailyAverage } = data;

  return (
    <div className="w-full space-y-6">
      {/* Productivity Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
            <CheckCircle2Icon className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Completed Tasks (7 Days)</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">{totalCompletedIn7Days}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-chart-2/15 text-chart-2 shrink-0">
            <ZapIcon className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Daily Average</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">{dailyAverage} <span className="text-xs font-normal text-muted-foreground">tasks/day</span></p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-chart-4/15 text-chart-4 shrink-0">
            <FolderIcon className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Top Project</p>
            <p className="text-lg font-bold tracking-tight text-foreground truncate max-w-[170px]" title={mostActiveProject}>
              {mostActiveProject}
            </p>
          </div>
        </Card>
      </div>

      {/* Main Bar Chart Card */}
      <Card className="w-full shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-2">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <CalendarIcon className="size-4 text-muted-foreground" />
              7-Day Task Completion
            </CardTitle>
            <CardDescription>
              Tasks completed over the past 7 days
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {totalCompletedIn7Days === 0 ? (
            <div className="h-[320px] flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
              <CheckCircle2Icon className="size-12 text-muted/60 mb-2" />
              <p className="text-base font-medium">No tasks completed in the last 7 days</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Complete tasks in your projects to see your activity timeline and project breakdowns here.
              </p>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="w-full h-[360px] md:h-[420px]">
              <BarChart
                accessibilityLayer
                data={chartData}
                margin={{
                  top: 20,
                  right: 16,
                  left: -10,
                  bottom: 8,
                }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis
                  dataKey="dayName"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  className="text-xs font-medium text-muted-foreground"
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  className="text-xs text-muted-foreground"
                />
                <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                <ChartLegend content={<ChartLegendContent />} />
                {categories.map((cat, index) => {
                  const safeKey = cat.replace(/[^a-zA-Z0-9_-]/g, "_");
                  return (
                    <Bar
                      key={cat}
                      dataKey={cat}
                      stackId="a"
                      fill={`var(--color-${safeKey})`}
                    />
                  );
                })}
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}