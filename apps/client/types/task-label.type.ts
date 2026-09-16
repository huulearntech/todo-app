export type TaskLabel = {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  color?: string; // Optional color property for the label
}


