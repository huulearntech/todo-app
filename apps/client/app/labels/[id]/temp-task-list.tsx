"use client";

import { useQuery } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import TaskCard from "@/components/(home)/task-card";

export default function TempTaskList({ labelId }: { labelId: string }) {
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ["tasks", { labelId }], // TODO: @Cleanup
    queryFn: () => taskService.getMyTasks({ taskLabelIds: [labelId] }),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {String(error)}</div>;
  }
  
  // if (!tasks || tasks.length === 0) {
  //   return <div>No tasks found for this label.</div>;
  // }

  return (
    <ul className="flex flex-col gap-2.5">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </ul>
  );
}