export const colorQueryKeys = {
  all: ["colors"] as const,
};

export const projectQueryKeys = {
  all: ["projects"] as const,
  lists: () => [...projectQueryKeys.all, "list"] as const,
  list: (type?: string) =>
    type ? ([...projectQueryKeys.all, type] as const) : projectQueryKeys.all,
  nonDefault: () => ["projects", "non_default"] as const,
  detail: (id: string) => [...projectQueryKeys.all, id] as const,
};

export const sectionQueryKeys = {
  all: ["sections"] as const,
  byProject: (projectId: string) => ["sections", { projectId }] as const,
  detail: (id: string) => ["sections", id] as const,
};

export type TaskStatusFilter = "pending" | "completed";

export const taskQueryKeys = {
  all: ["tasks"] as const,
  byProject: (projectId: string, status: TaskStatusFilter = "pending") =>
    ["tasks", { projectId, status }] as const,
  dueToday: (status: TaskStatusFilter = "pending") =>
    ["tasks", "due-today", { status }] as const,
  byLabel: (labelId: string, status: TaskStatusFilter = "pending") =>
    ["tasks", { labelId, status }] as const,
  completed: () => ["tasks", "completed"] as const,
  search: (query: string) => ["search-tasks", query] as const,
};

export const labelQueryKeys = {
  all: ["task-labels"] as const,
  byTask: (taskId: string) => ["task-labels", taskId] as const,
};

export const productivityQueryKeys = {
  all: ["productivity"] as const,
  goals: () => [...productivityQueryKeys.all, "goals"] as const,
  history: () => [...productivityQueryKeys.all, "history"] as const,
  completedLast7Days: () =>
    [...productivityQueryKeys.all, "completed-last-7-days"] as const,
};

export const searchQueryKeys = {
  global: (query: string) => ["global-search", query] as const,
  tasks: (query: string) => ["search-tasks", query] as const,
  projects: (query: string) => ["search-projects", query] as const,
};
