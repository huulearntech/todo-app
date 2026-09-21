import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Req } from '@nestjs/common';

import { Request } from 'express';
import { TaskLabelService } from './task-label.service';
import { TaskLabelDto } from './task-label.dto';
import { TaskService } from '../tasks/task.service';

@Controller('task-labels')
export class TaskLabelController {
  constructor(
    private readonly taskLabelService: TaskLabelService,
    private readonly taskService: TaskService
  ) {}

  @Post()
  async createTaskLabel(
    @Req() request: Request & { user: { id: string } },
    @Body() body: TaskLabelDto
  ) {
    const userId = request.user.id;
    const { name, description } = body;

    return this.taskLabelService.createTaskLabel(userId, name, description);
  }

  // TODO: @Cleanup
  @Get()
  async getAllTaskLabels() {
    return this.taskLabelService.getAllTaskLabels();
  }

  @Get("me")
  async getMyTaskLabels(
    @Req() request: Request & { user: { id: string } }
  ) {
    return this.taskLabelService.getTaskLabelsByOwnerId(request.user.id);
  }

  @Get(':id')
  async getTaskLabelById() {
  
  }

  @Get(':id')
  async getTasksByTaskLabelId(
    @Req() request: Request & { user: { id: string } },
    @Param('id') labelId: string
  ) {
    return this.taskService.getTasksByOwnerIdAndLabelId(request.user.id, labelId);
  }

  @Patch(':id')
  async updateTaskLabel(
    @Req() request: Request & { user: { id: string } },
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
