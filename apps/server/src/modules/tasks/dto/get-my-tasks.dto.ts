export class GetMyTasksFilterDto {
  title?: string;
  status?: string;
  projectId?: string;
  // taskLabelIds?: string[];
}
// TODO: when search by many task labels, might count the appearance of record => bigger number = more relevance