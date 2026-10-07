import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskRecurrence } from '../entities/task-recurrence.entity';
import { type RRule } from '@todo/shared';

@Injectable()
export class TaskRecurrenceService {
  constructor(
    // private readonly dataSource: DataSource,
    @InjectRepository(TaskRecurrence)
    private readonly taskRecurrenceRepository: Repository<TaskRecurrence>,
  ) {}

  async createTaskRecurrence(
    taskId: string,
    rrule: RRule,
    startsAt: Date | null,
    endsAt: Date | null,
    timezone: string,
  ): Promise<TaskRecurrence> {
    const newTaskRecurrence = this.taskRecurrenceRepository.create({
      rrule,
      startsAt,
      endsAt,
      timezone,
    });

    return this.taskRecurrenceRepository.save(newTaskRecurrence);
  }

  async getTaskRecurrenceByTaskId(
    taskId: string,
  ): Promise<TaskRecurrence | null> {
    return this.taskRecurrenceRepository.findOne({
      where: { task: { id: taskId } },
    });
  }

  async updateTaskRecurrence(
    taskId: string,
    rrule: RRule,
    startsAt: Date | null,
    endsAt: Date | null,
    timezone: string,
  ): Promise<TaskRecurrence | null> {
    const taskRecurrence = await this.getTaskRecurrenceByTaskId(taskId);
    if (!taskRecurrence) {
      return null;
    }

    taskRecurrence.rrule = rrule;
    taskRecurrence.startsAt = startsAt;
    taskRecurrence.endsAt = endsAt;
    taskRecurrence.timezone = timezone;

    return this.taskRecurrenceRepository.save(taskRecurrence);
  }
}
