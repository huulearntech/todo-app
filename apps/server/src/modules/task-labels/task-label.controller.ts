import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { TaskLabelService } from './task-label.service';
import { CreateTaskLabelDto, UpdateTaskLabelDto } from './task-label.dto';
import { TaskService } from '../tasks/services/task.service';
import { TaskFilterDto } from '../tasks/dto/get-my-tasks.dto';
import {
  CurrentUser,
  type JwtUser,
} from '../auth/decorators/current-user.decorator';

@Controller('task-labels')
export class TaskLabelController {
  constructor(
    private readonly taskLabelService: TaskLabelService,
    private readonly taskService: TaskService,
  ) {}

  @Post()
  async createTaskLabel(
    @CurrentUser() user: JwtUser,
    @Body() body: CreateTaskLabelDto,
  ) {
    return this.taskLabelService.createTaskLabel(user.id, body);
  }

  @Get('me')
  async getMyTaskLabels(@CurrentUser() user: JwtUser) {
    return this.taskLabelService.getTaskLabelsByOwnerId(user.id);
  }

  @Get(':id')
  async getTaskLabelById(@Param('id', ParseUUIDPipe) labelId: string) {
    const label = await this.taskLabelService.getTaskLabelById(labelId);
    if (!label) {
      throw new NotFoundException(`Task label with ID ${labelId} not found`);
    }
    return label;
  }

  // TODO: @Remove
  @Get(':id/tasks')
  async getTasksByTaskLabelId(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) labelId: string,
    @Query() filter: TaskFilterDto = {},
  ) {
    const combinedFilter = { ...filter, taskLabelIds: [labelId] };
    if (filter.status === 'completed') {
      return this.taskService.getCompletedOccurrencesByOwnerIdAndFilter(
        user.id,
        combinedFilter,
      );
    }
    return this.taskService.getTasksByOwnerIdAndFilter(user.id, combinedFilter);
  }

  @Patch(':id')
  async updateTaskLabel(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) labelId: string,
    @Body() body: UpdateTaskLabelDto,
  ) {
    const updatedTaskLabel = await this.taskLabelService.updateTaskLabel(
      labelId,
      body,
      user.id,
    );

    if (!updatedTaskLabel) {
      throw new NotFoundException(`Task label with ID ${labelId} not found`);
    }

    return updatedTaskLabel;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTaskLabel(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.taskLabelService.deleteTaskLabel({ ownerId: user.id, id });
  }
}
