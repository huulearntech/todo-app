export const priorityConfig = {
  high: {
    label: "High",
    color: "text-red-500 fill-red-500/20",
    badge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
  medium: {
    label: "Medium",
    color: "text-amber-500 fill-amber-500/20",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  low: {
    label: "Low",
    color: "text-blue-500 fill-blue-500/20",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
} as const;

export type PriorityKey = keyof typeof priorityConfig;
