"use client";

// TODO:
// 1. Virtualization
// 2. Pagination (infinite scroll)


import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";

export default function TaskList() {
  const queryClient = useQueryClient();
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => taskService.getMyTasks({
      projectId: "9da6157d-8d63-4470-bcdd-f2b5c9064b10" // FIX: fix hardcoded @Temporary
    })
  });

  const mutation = useMutation({
    mutationFn: taskService.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  });

  const handleDelete = (id: string) => {
    mutation.mutate(id);
  };

  return (
    <ul className="list-disc list-inside">
      {tasks.map((task) => (
        <li key={task.id}>
          {task.title}
        </li>
      ))}
    </ul>
  );
}