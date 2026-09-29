"use client";

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from "recharts";
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart";

import { useQuery } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted-foreground)", // Color for "Other" / "No Project"
];

export default function TempCompletedStackedBarChart() {
  const { data, isLoading } = useQuery({
    queryKey: ["completed-tasks-last-7-days"],
    queryFn: taskService.getMyTasksCompletedInLast7Days,
    select: (tasks) => {
      console.log("Fetched tasks for chart:", tasks);

      // 1. Initialize the last 7 days (YYYY-MM-DD)
      const today = new Date();
      const dateMap: Record<string, Record<string, number>> = {};
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateString = date.toISOString().split("T")[0];
        dateMap[dateString] = {};
      }

      // 2. Compute global frequencies by Project Name to find the Top 5
      const projectCounts: Record<string, number> = {};
      tasks.forEach((task) => {
        console.log("Processing task for chart:", task);
        const projectName = task.section.project.name;
        projectCounts[projectName] = (projectCounts[projectName] || 0) + 1;
      });

      const top5Projects = Object.entries(projectCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name]) => name);

      const categories = [...top5Projects, "Other"];

      // Ensure every date has an entry for all categories (defaulting to 0)
      Object.keys(dateMap).forEach((dateStr) => {
        categories.forEach((cat) => {
          dateMap[dateStr][cat] = 0;
        });
      });

      // 3. Map tasks into their correct date and project category bucket
      tasks.forEach((task) => {
        if (!task.completedAt) return;
        const completedDate = task.completedAt.split("T")[0];

        if (dateMap[completedDate]) {
          const projectName = task.section.project.name;
          // If it's in the top 5, use its name; otherwise, bucket into "Other"
          const category = top5Projects.includes(projectName) ? projectName : "Other";
          dateMap[completedDate][category] += 1;
        }
      });

      // 4. Format into an array ready for Recharts
      const chartData = Object.entries(dateMap).map(([date, counts]) => {
        const total = Object.values(counts).reduce((sum, val) => sum + val, 0);
        return {
          name: date,
          ...counts,
          total,
        };
      });

      return { chartData, categories };
    },
  });

  if (!data) console.log("No data available for the chart.");

  if (isLoading || !data) {
    return <div>Loading chart...</div>;
  }

  const { chartData, categories } = data;

  const dynamicConfig: ChartConfig = categories.reduce((acc, cat, idx) => {
    acc[cat] = {
      label: cat,
      color: CHART_COLORS[idx % CHART_COLORS.length],
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <ChartContainer config={dynamicConfig} className="w-full max-w-2xl">
      <BarChart
        accessibilityLayer
        width={500}
        height={300}
        layout="vertical"
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" />
        <Tooltip />
        <Legend />
        
        {categories.map((cat, index) => (
          <Bar
            key={cat}
            dataKey={cat}
            stackId="a"
            fill={CHART_COLORS[index % CHART_COLORS.length]}
          >
            {index === categories.length - 1 && (
              <LabelList dataKey="total" position="right" offset={10} />
            )}
          </Bar>
        ))}
      </BarChart>
    </ChartContainer>
  );
}