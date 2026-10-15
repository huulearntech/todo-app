import type {
  TaskResponseDto as Task,
  SectionResponseDto,
} from "@todo/shared";

/**
 * Groups tasks by section, applying the provided filter predicate to each task.
 */
export function groupBySection(
  sections: SectionResponseDto[] | undefined,
  tasks: Task[] | undefined,
  filterPredicate: (task: Task) => boolean
): Record<string, Task[]> {
  const acc: Record<string, Task[]> = {};
  if (!sections) return acc;

  for (const section of sections) {
    acc[section.id] = [];
  }

  if (!tasks) return acc;

  for (const task of tasks) {
    if (!filterPredicate(task)) {
      continue;
    }
    (acc[task.sectionId] ??= []).push(task);
  }

  return acc;
}
