import { BadRequestException, Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query } from "@nestjs/common";
import { TaskRecurrenceService } from "../services/task-recurrence.service";

import { type RRuleDto } from "../dto/task-recurrence.dto";

import { CurrentUser, type JwtUser } from "@/src/modules/auth/decorators/current-user.decorator";


@Controller("task_recurrences")
export class TaskRecurrencesController {
  constructor(private readonly taskRecurrenceService: TaskRecurrenceService) {}

  // @Post()
  // async createTaskRecurrence(
  //   @CurrentUser() user: JwtUser,
  //   @Body() createTaskRecurrenceDto: RRuleDto
  // ) {
  //   return this.taskRecurrenceService.createTaskRecurrence(
  //     createTaskRecurrenceDto.taskId,
  //     createTaskRecurrenceDto.rrule,
  //     createTaskRecurrenceDto.startsAt,
  //     createTaskRecurrenceDto.endsAt,
  //     createTaskRecurrenceDto.timezone
  //   );
  // }

  @Get(":id")
  async getTaskRecurrence(@Param("id") id: string) {
    const taskRecurrence = await this.taskRecurrenceService.getTaskRecurrenceByTaskId(id);
    if (!taskRecurrence) {
      throw new BadRequestException(`Task recurrence with id ${id} not found`);
    }
    return taskRecurrence;
  }

  // @Delete(":id")
  // async deleteTask(@Param() id: string) {
  //   return this.taskService.deleteTask(id);
  // }

  // @Patch(":id")
  // async updateTask(
  //   // @CurrentUser() user: JwtUser,
  //   @Param("id") id: string,
  //   @Body() updateTaskDto: UpdateTaskDto
  // ) {
  //   return this.taskService.updateTask(id, updateTaskDto);
  // }
}