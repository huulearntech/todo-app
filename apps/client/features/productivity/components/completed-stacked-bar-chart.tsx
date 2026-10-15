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

import { useCompletedTasksLast7Days } from "@/features/productivity/hooks/use-completed-tasks-last-7-days";
import { CheckCircle2Icon, CalendarIcon } from "lucide-react";
import {
  transformCompletedTasksForBarChart,
  buildChartConfig,
} from "@/features/productivity/utils/chart-metrics";
import { ChartMetricSummary } from "./chart-metric-summary";

export default function CompletedStackedBarChart() {
  const { data, isLoading } = useCompletedTasksLast7Days({
    select: transformCompletedTasksForBarChart,
  });

  const chartConfig: ChartConfig = useMemo(() => {
    return buildChartConfig(data?.categories ?? []);
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
      <ChartMetricSummary
        totalCompletedIn7Days={totalCompletedIn7Days}
        dailyAverage={dailyAverage}
        mostActiveProject={mostActiveProject}
      />

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
                {categories.map((cat) => {
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