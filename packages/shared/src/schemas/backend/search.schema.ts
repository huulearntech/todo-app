import { z } from "zod";
import { TaskPriority } from "../../enums/task-priority.enum.js";

export const searchProjectResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  colorHexCode: z.string(),
  score: z.number().optional(),
});

export type SearchProjectResultDto = z.infer<typeof searchProjectResultSchema>;

export const searchLabelResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  colorHexCode: z.string(),
  score: z.number().optional(),
});

export type SearchLabelResultDto = z.infer<typeof searchLabelResultSchema>;

export const searchTaskResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  priority: z.enum(TaskPriority),
  completedAt: z.union([z.string(), z.date()]).nullable().optional(),
  sectionId: z.string().optional(),
  sectionName: z.string().optional(),
  projectId: z.string().optional(),
  projectName: z.string().optional(),
  projectColorHexCode: z.string().optional(),
  score: z.number().optional(),
});

export type SearchTaskResultDto = z.infer<typeof searchTaskResultSchema>;

export const searchResultsSchema = z.object({
  projects: z.array(searchProjectResultSchema),
  labels: z.array(searchLabelResultSchema),
  tasks: z.array(searchTaskResultSchema),
});

export type SearchResultsDto = z.infer<typeof searchResultsSchema>;

export const searchQuerySchema = z.object({
  q: z.string().min(1, "Search query must not be empty"),
});

export type SearchQueryDto = z.infer<typeof searchQuerySchema>;
