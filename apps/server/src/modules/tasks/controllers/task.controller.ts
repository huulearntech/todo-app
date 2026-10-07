import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { TaskService } from '../services/task.service';

import { AddTaskDto, ReorderTaskDto, UpdateTaskDto } from '../dto/add-task.dto';
import { TaskFilterDto } from '../dto/get-my-tasks.dto';
import {
  CompleteTaskOccurrenceDto,
  PostponeTaskDto,
} from '../dto/task-occurrence.dto';

import { DateTime } from 'luxon';
import {
  CurrentUser,
  type JwtUser,
} from '@/src/modules/auth/decorators/current-user.decorator';

@Controller('tasks')
export class TasksController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  async createTask(
    @CurrentUser() user: JwtUser,
    @Body() createTaskReqDto: AddTaskDto,
  ) {
    return this.taskService.createTask(user.id, createTaskReqDto);
  }

  @Get('me')
  async getMyTasks(
    @CurrentUser() user: JwtUser,
    @Query() filter: TaskFilterDto = {},
  ) {
    return this.taskService.getTasksByOwnerIdAndFilter(user.id, filter);
  }

  // NOTE: What does even "today" mean? it depends on the timezone of the user, not the server.
  // So we need to get the timezone of the user somehow.
  @Get('me/due-today')
  async getMyTasksDueToday(
    @CurrentUser() user: JwtUser,
    @Headers('x-timezone') timezone: string,
  ) {
    const nowInUserTimezone = DateTime.now().setZone(timezone);
    if (!nowInUserTimezone.isValid) {
      throw new BadRequestException(
        `Invalid timezone: ${timezone}. ${nowInUserTimezone.invalidExplanation}`,
      );
    }

    const startOfDay = nowInUserTimezone.startOf('day').toISO();
    const endOfDay = nowInUserTimezone.endOf('day').toISO();

    return this.taskService.getTasksByOwnerIdThatDueInTimeRange(
      user.id,
      startOfDay,
      endOfDay,
    );
  }

  @Get('me/completed-last-7-days')
  async getMyCompletedTasksInTheLast7Days(
    @CurrentUser() user: JwtUser,
    @Headers('x-timezone') timezone: string,
  ) {
    const nowInUserTimezone = DateTime.now().setZone(timezone);
    if (!nowInUserTimezone.isValid) {
      throw new BadRequestException(
        `Invalid timezone: ${timezone}. ${nowInUserTimezone.invalidExplanation}`,
      );
    }

    const startOfDay7DaysAgo = nowInUserTimezone
      .startOf('day')
      .minus({ days: 7 })
      .toISO();
    const startOfToday = nowInUserTimezone.startOf('day').toISO();

    return this.taskService.getTasksByOwnerIdThatCompletedInTimeRange(
      user.id,
      startOfDay7DaysAgo,
      startOfToday,
    );
  }

  @Delete(':id')
  async deleteTask(@Param('id') id: string) {
    return this.taskService.deleteTask(id);
  }

  @Post(':id/occurrences/complete')
  async completeTaskOccurrence(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() body?: CompleteTaskOccurrenceDto,
  ) {
    const scheduledDate = body?.scheduledDate
      ? new Date(body.scheduledDate)
      : undefined;
    const completedAt = body?.completedAt
      ? new Date(body.completedAt)
      : undefined;
    return this.taskService.completeTaskOccurrence(user.id, id, {
      scheduledDate,
      completedAt,
    });
  }

  @Post(':id/complete')
  async completeTask(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() body?: CompleteTaskOccurrenceDto,
  ) {
    return this.completeTaskOccurrence(user, id, body);
  }

  @Post(':id/occurrences/uncomplete')
  async uncompleteTaskOccurrence(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
  ) {
    return this.taskService.uncompleteTaskOccurrence(user.id, id);
  }

  @Post(':id/uncomplete')
  async uncompleteTask(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.uncompleteTaskOccurrence(user, id);
  }

  @Post(':id/postpone')
  async postponeTask(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() body: PostponeTaskDto,
  ) {
    return this.taskService.postponeTask(
      user.id,
      id,
      new Date(body.postponeTo),
    );
  }

  @Patch(':id')
  async updateTask(
    // @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.taskService.updateTask(id, updateTaskDto);
  }

  @Patch(':id/reorder')
  async updateTaskOrder(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() { sectionId, prevId }: ReorderTaskDto,
  ) {
    await this.taskService.updateTaskOrder({
      ownerId: user.id,
      taskId: id,
      sectionId,
      prevId,
    });
  }
}
