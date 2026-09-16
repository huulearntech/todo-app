"use client";

import { useQuery } from "@tanstack/react-query";
import { taskLabelService } from "@/services/task-label.service";

export default function TempTaskLabelList() {
  const { data: labels = [], isLoading } = useQuery({
    queryKey: ["labels"],
    queryFn: async () => {
      const response = await taskLabelService.getMyTaskLabels();
      console.log("Fetched labels:", response.data); // Log the fetched labels
      return response.data;
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Temporary Label List</h2>
      <ul>
        {labels.map((label) => (
          <li key={label.id}>{label.name}</li>
        ))}
      </ul>
    </div>
  );
}
