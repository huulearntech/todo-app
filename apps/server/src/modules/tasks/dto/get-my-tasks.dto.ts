export class GetMyTasksFilterDto {
  title?: string;
  status?: string;
  projectId?: string;
  taskLabelId?: string; // NOTE: this might be many labels
}
// TODO: when search by many task labels, might count the appearance of record => bigger number = more relevance