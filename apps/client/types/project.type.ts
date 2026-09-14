export type Project = {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
}