// TODO: remove
import { TaskPriority } from "@todo/shared";

export type Task = {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  startedAt?: Date;
  dueAt?: Date;
  description?: string;
  priority: TaskPriority;
  sectionId: string; // TODO: fix
  timeRange: {
    start: { date: string; time: string },
    end: { date: string; time: string },
  } | null;
  // ownerId: string;
  section: {
    id: string;
    name: string;
  };
  labels: {
    id: string;
    name: string;
  }[];
};

