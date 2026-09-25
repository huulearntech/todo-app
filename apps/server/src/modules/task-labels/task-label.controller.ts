import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { TaskLabelService } from './task-label.service';
import { TaskLabelDto } from './task-label.dto';
import { TaskService } from '../tasks/task.service';
import { CurrentUser, type JwtUser } from '../auth/decorators/current-user.decorator';

@Controller('task-labels')
export class TaskLabelController {
  constructor(
    private readonly taskLabelService: TaskLabelService,
    private readonly taskService: TaskService
  ) {}

  @Post()
  async createTaskLabel(
    @CurrentUser() user: JwtUser,
    @Body() body: TaskLabelDto
  ) {
    const { name, description } = body;

    return this.taskLabelService.createTaskLabel(user.id, name, description);
  }

  @Get("me")
  async getMyTaskLabels(
    @CurrentUser() user: JwtUser
  ) {
    return this.taskLabelService.getTaskLabelsByOwnerId(user.id);
  }

  @Get(':id')
  async getTaskLabelById() {
  
  }

  @Get(':id')
  async getTasksByTaskLabelId(
    @CurrentUser() user: JwtUser,
    @Param('id') labelId: string
  ) {
    return this.taskService.getTasksByOwnerIdAndLabelId(user.id, labelId);
  }

  @Patch(':id')
  async updateTaskLabel(
    // @CurrentUser() user: JwtUser,
    @Param('id') labelId: string,
    @Body() body: TaskLabelDto
  ) {
    const updatedTaskLabel = await this.taskLabelService.updateTaskLabel(labelId, body);

    if (!updatedTaskLabel) {
      throw new Error(`Task label with ID ${labelId} not found`);
    }

    return updatedTaskLabel;
  }

  @Delete(':id')
  async deleteTaskLabel() {
    
  }
}
