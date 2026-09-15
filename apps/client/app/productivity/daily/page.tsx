import { TempCircularProgress } from "../temp-circular-progress-indicator";
import TempCompletedStackedBarChart from "../temp-completed-stacked-bar-chart";

import { Medal } from "lucide-react"

export default function DailyProductivityPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold">Your Productivity</h1>
      <p className="mt-4 text-lg text-gray-600">
        Daily goal completed: <b>5/10 tasks</b>
      </p>
      <TempCircularProgress
        size={100}
        progress={0.5}
        strokeWidth={8}
        className="mt-4 fill-chart-1"
        icon={<Medal className="w-12 h-12" />}
      />

      <p className="mt-2 text-lg text-gray-600">
        Nice work, (User Name)
      </p>
      <TempCompletedStackedBarChart />
    </div>
  );
}