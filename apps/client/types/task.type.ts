import { TaskPriority } from "@todo/shared";

export type Task = {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  dueDate?: Date;
  description?: string;
  priority: TaskPriority;
  ownerId: string;
  section: {
    id: string;
    name: string;
  } | null;
};

