// TODO: remove
import { type CreateTaskDto } from "@todo/shared";

export type Task = CreateTaskDto & {
  id: string;
  completedAt?: Date;
  // ownerId: string;
  labels: {
    id: string;
    name: string;
  }[];
};