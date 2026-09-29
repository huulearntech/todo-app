import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { TaskRecurrence } from "../entities/task-recurrence.entity";

@Injectable()
export class TaskRecurrenceService {
  constructor(
    // private readonly dataSource: DataSource,
    @InjectRepository(TaskRecurrence) private readonly taskRecurrenceRepository: Repository<TaskRecurrence>,
  ) {}

  async createTaskRecurrence(taskId: string, rruleString: string, startsAt: Date | null, endsAt: Date | null, timezone: string): Promise<TaskRecurrence> {
    const newTaskRecurrence = this.taskRecurrenceRepository.create({
      taskId,
      rruleString,
      startsAt,
      endsAt,
      timezone,
    });

    return this.taskRecurrenceRepository.save(newTaskRecurrence);
  }

  async getTaskRecurrenceByTaskId(taskId: string): Promise<TaskRecurrence | null> {
    return this.taskRecurrenceRepository.findOne({ where: { taskId } });
  }

  async updateTaskRecurrence(taskId: string, rruleString: string, startsAt: Date | null, endsAt: Date | null, timezone: string): Promise<TaskRecurrence | null> {
    const taskRecurrence = await this.getTaskRecurrenceByTaskId(taskId);
    if (!taskRecurrence) {
      return null;
    }

    taskRecurrence.rruleString = rruleString;
    taskRecurrence.startsAt = startsAt;
    taskRecurrence.endsAt = endsAt;
    taskRecurrence.timezone = timezone;

    return this.taskRecurrenceRepository.save(taskRecurrence);
  }

  async deleteTaskRecurrence(taskId: string): Promise<boolean> {
    const result = await this.taskRecurrenceRepository.delete({ taskId });
    return result.affected !== 0; // TODO: ?? Can be null or undefined?
  }

  // async validateRecurrenceRule(rule: string): Promise<boolean> {
  // }


  // async calculateNextOccurrence(taskId: string, afterDate: Date): Promise<Date | null> {
  //   const taskRecurrence = await this.getTaskRecurrenceByTaskId(taskId);
  //   if (!taskRecurrence) {
  //     return null;
  //   }

  //   const { rule, startsAt, endsAt, timezone } = taskRecurrence;
  
}