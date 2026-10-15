"use client";

import { Card } from "@/components/ui/card";
import { CheckCircle2Icon, ZapIcon, FolderIcon } from "lucide-react";

export interface ChartMetricSummaryProps {
  totalCompletedIn7Days: number;
  dailyAverage: string;
  mostActiveProject: string;
}

export function ChartMetricSummary({
  totalCompletedIn7Days,
  dailyAverage,
  mostActiveProject,
}: ChartMetricSummaryProps) {
  return (
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
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {dailyAverage} <span className="text-xs font-normal text-muted-foreground">tasks/day</span>
          </p>
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
  );
}
