import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TaskLabel } from './task-label.entity';
import { InjectRepository } from '@nestjs/typeorm';


@Injectable()
export class TaskLabelService {
  constructor(
    @InjectRepository(TaskLabel)
    private readonly taskLabelRepository: Repository<TaskLabel>
  ) {}

  async createTaskLabel(ownerId: string, name: string, description?: string): Promise<TaskLabel> {
    const taskLabel = this.taskLabelRepository.create({ ownerId, name, description });
    return this.taskLabelRepository.save(taskLabel);
  }

  async getAllTaskLabels(): Promise<TaskLabel[]> {
    return this.taskLabelRepository.find();
  }

  async getTaskLabelById(id: string): Promise<TaskLabel | null> {
    return this.taskLabelRepository.findOne({ where: { id } });
  }

  async updateTaskLabel(id: string, updatedTaskLabel: Partial<TaskLabel>): Promise<TaskLabel | null> {
    const taskLabel = await this.getTaskLabelById(id);
    if (!taskLabel) {
      return null;
    }
    Object.assign(taskLabel, updatedTaskLabel);
    return this.taskLabelRepository.save(taskLabel);
  }

  async deleteTaskLabel(id: string): Promise<boolean> {
    const result = await this.taskLabelRepository.delete(id);
    return result.affected !== 0;
  }
}