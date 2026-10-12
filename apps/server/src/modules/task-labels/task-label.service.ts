import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TaskLabel } from './task-label.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTaskLabelDto, UpdateTaskLabelDto } from './task-label.dto';

@Injectable()
export class TaskLabelService {
  constructor(
    @InjectRepository(TaskLabel)
    private readonly taskLabelRepository: Repository<TaskLabel>,
  ) {}

  async createTaskLabel(
    ownerId: string,
    dtoOrName: CreateTaskLabelDto | string,
    description?: string,
    rawColorKey?: string,
  ): Promise<TaskLabel> {
    let name: string;
    let desc: string | undefined;
    let key = 'slate';

    if (typeof dtoOrName === 'string') {
      name = dtoOrName;
      desc = description;
      if (rawColorKey) key = rawColorKey;
    } else {
      name = dtoOrName.name;
      desc = dtoOrName.description;
      if (dtoOrName.colorKey) key = dtoOrName.colorKey;
    }

    const normalizedKey = key.toLowerCase().trim();

    const taskLabel = this.taskLabelRepository.create({
      ownerId,
      name: name.trim(),
      description: desc?.trim(),
      colorKey: normalizedKey,
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

  async getTaskLabelById(id: string): Promise<TaskLabel | null> {
    return this.taskLabelRepository.findOne({
      where: { id },
    });
  }

  async updateTaskLabel(
    id: string,
    updatedTaskLabel: Partial<UpdateTaskLabelDto>,
    ownerId?: string,
  ): Promise<TaskLabel | null> {
    const taskLabel = await this.getTaskLabelById(id);
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
      taskLabel.colorKey = updatedTaskLabel.colorKey.toLowerCase().trim();
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
