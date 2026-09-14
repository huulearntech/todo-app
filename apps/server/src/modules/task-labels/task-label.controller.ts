import { Body, Controller, Delete, Get, Post, Put, Req } from '@nestjs/common';

import { Request } from 'express';
import { TaskLabelService } from './task-label.service';
import { TaskLabelDto } from './task-label.dto';

@Controller('task-labels')
export class TaskLabelController {
  constructor(private readonly taskLabelService: TaskLabelService) {}

  @Post()
  async createTaskLabel(
    @Req() request: Request & { user: { id: string } },
    @Body() body: TaskLabelDto
  ) {
    const userId = request.user.id;
    const { name, description } = body;

    return this.taskLabelService.createTaskLabel(userId, name, description);
  }

  @Get()
  async getAllTaskLabels() {
    return this.taskLabelService.getAllTaskLabels();
  }

  @Get(':id')
  async getTaskLabelById() {
  
  }

  @Put(':id')
  async updateTaskLabel() {
    
  }

  @Delete(':id')
  async deleteTaskLabel() {
    
  }
}
