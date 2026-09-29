"use client";

// TODO:
// 1. Virtualization
// 2. Pagination (infinite scroll)


import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import TaskItemListView from "@/components/(home)/task-card";
import { useAuth } from "@/providers/AuthProvider";

export default function TaskList() {
  // const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", "due-today"],
    queryFn: () => taskService.getMyTasksDueToday()
  });

  // const mutation = useMutation({
  //   mutationFn: taskService.deleteTask,
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ["tasks", "due-today"] });
  //   }
  // });

  // const handleDelete = (id: string) => {
  //   mutation.mutate(id);
  // };

  return (
    <ul className="flex flex-col gap-2.5">
      {tasks.map((task) => (
        <TaskItemListView key={task.id} task={task} />
      ))}
    </ul>
  );
}