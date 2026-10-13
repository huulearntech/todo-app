import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TaskLabel } from './task-label.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTaskLabelDto, UpdateTaskLabelDto } from './task-label.dto';

import { ColorService } from '../colors/color.service';

@Injectable()
export class TaskLabelService {
  constructor(
    @InjectRepository(TaskLabel)
    private readonly taskLabelRepository: Repository<TaskLabel>,
  ) {}

  async createTaskLabel(
    ownerId: string,
    createTaskLabelDto: CreateTaskLabelDto,
  ): Promise<TaskLabel> {
    const key = ColorService.resolveColor(createTaskLabelDto.colorKey, 'slate');

    const taskLabel = this.taskLabelRepository.create({
      ownerId,
      name: createTaskLabelDto.name.trim(),
      description: createTaskLabelDto.description?.trim(),
      colorKey: key,
    });

    const saved = await this.taskLabelRepository.save(taskLabel);
    return (await this.getTaskLabelById(saved.id)) ?? saved;
  }

  async getTaskLabelsByOwnerId(ownerId: string): Promise<TaskLabel[]> {
    return this.taskLabelRepository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
  }

  async getTaskLabelById(
    id: string,
    ownerId?: string,
  ): Promise<TaskLabel | null> {
    return this.taskLabelRepository.findOne({
      where: ownerId ? { id, ownerId } : { id },
    });
  }

  async updateTaskLabel(
    id: string,
    updatedTaskLabel: Partial<UpdateTaskLabelDto>,
    ownerId?: string,
  ): Promise<TaskLabel | null> {
    const taskLabel = await this.getTaskLabelById(id, ownerId);
    if (!taskLabel) {
      return null;
    }

    if (ownerId && taskLabel.ownerId !== ownerId) {
      return null;
    }

    if (updatedTaskLabel.name !== undefined) {
      taskLabel.name = updatedTaskLabel.name.trim();
    }

    if (updatedTaskLabel.description !== undefined) {
      taskLabel.description = updatedTaskLabel.description?.trim();
    }

    if (updatedTaskLabel.colorKey !== undefined) {
      taskLabel.colorKey = ColorService.resolveColor(updatedTaskLabel.colorKey);
    }

    await this.taskLabelRepository.save(taskLabel);
    return this.getTaskLabelById(id);
  }

  async deleteTaskLabel({
    id,
    ownerId,
  }: {
    id: string;
    ownerId: string;
  }): Promise<void> {
    const result = await this.taskLabelRepository.delete({ id, ownerId });
    if (result.affected === 0) {
      throw new NotFoundException(`Task label with ID ${id} not found`);
    }
  }
}
