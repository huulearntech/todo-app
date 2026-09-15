export type Task = {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  dueDate?: Date;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'to_do' | 'in_progress' | 'done';
  category?: string;
  userId: string;
};

