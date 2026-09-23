import { IsOptional, IsString, IsISO8601 } from "class-validator";

export class Dto_Filter_GetTasks {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsISO8601()
  dueDate?: string;


  // taskLabelIds?: string[];
}
// TODO: when search by many task labels, might count the appearance of record => bigger number = more relevance