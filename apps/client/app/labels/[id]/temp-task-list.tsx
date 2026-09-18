"use client";

import { useQuery } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import TaskItemListView from "@/components/(home)/task-item__list-view";

export default function TempTaskList({ labelId }: { labelId: string }) {
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ["tasks", "label", labelId], // TODO: @Cleanup
    queryFn: () => taskService.getMyTasksByLabelId(labelId),
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
    <ul>
      {tasks.map((task) => (
        <TaskItemListView key={task.id} task={task} />
      ))}
    </ul>
  );
}