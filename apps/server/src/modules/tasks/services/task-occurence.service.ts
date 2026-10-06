import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TaskOccurence } from '../entities/task-occurence.entity';

@Injectable()
export class TaskOccurenceService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(TaskOccurence)
    private readonly taskOccurenceRepository: Repository<TaskOccurence>,
  ) {}

  async createTaskOccurence(
    taskId: string,
    occurenceDate: Date,
  ): Promise<TaskOccurence> {
    const newTaskOccurence = this.taskOccurenceRepository.create({
      taskId,
    });

    return this.taskOccurenceRepository.save(newTaskOccurence);
  }

  async getTaskOccurencesByTaskId(taskId: string): Promise<TaskOccurence[]> {
    return this.taskOccurenceRepository.find({ where: { taskId } });
  }

  async deleteTaskOccurencesByTaskId(taskId: string): Promise<boolean> {
    const result = await this.taskOccurenceRepository.delete({ taskId });
    return result.affected !== 0; // TODO: ?? Can be null or undefined?
  }
}
