import { IsNumber } from "class-validator";

export default class RemoveTaskDto {
  @IsNumber()
  taskId!: string;
}