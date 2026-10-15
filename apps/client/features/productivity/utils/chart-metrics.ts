import type { TaskResponseDto as Task } from "@todo/shared";
import type { ChartConfig } from "@/components/ui/chart";

// Distinct harmonious palette for projects (light & dark mode compatible)
export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "oklch(0.556 0 0)", // Muted slate for "Other"
];

export interface ChartDayItem {
  date: string;
  dayName: string;
  displayLabel: string;
  total: number;
  [category: string]: string | number;
}

export interface CompletedTasksChartData {
  chartData: ChartDayItem[];
  categories: string[];
  totalCompletedIn7Days: number;
  mostActiveProject: string;
  dailyAverage: string;
}

/**
 * Transforms completed tasks into a structured 7-day chronological bar chart matrix,
 * including top 5 projects breakdown and aggregate summary metrics.
 */
export function transformCompletedTasksForBarChart(tasks: Task[]): CompletedTasksChartData {
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
  const chartData: ChartDayItem[] = past7Days.map((item) => {
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
}

/**
 * Generates shadcn/chart config mapping each category to its theme color token
 */
export function buildChartConfig(categories: string[]): ChartConfig {
  const config: ChartConfig = {};
  categories.forEach((cat, idx) => {
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
}
