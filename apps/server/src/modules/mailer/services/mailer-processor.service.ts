import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

import {
  EMAIL_QUEUE_NAME,
  EmailJobType,
  ImmediateEmailData,
  TaskReminderEmailData,
  RecurringTaskReminderEmailData,
} from '../mailer.constants';
import { MailerTransportService } from './mailer-transport.service';
import { MailerSchedulerService } from './mailer-scheduler.service';
import {
  getWelcomeEmailTemplate,
  getPasswordResetEmailTemplate,
  getTaskReminderEmailTemplate,
  getRecurringReminderEmailTemplate,
} from '../templates/email-templates';
import { Task } from '@/src/modules/tasks/entities/task.entity';

@Processor(EMAIL_QUEUE_NAME)
@Injectable()
export class MailerProcessor extends WorkerHost {
  private readonly logger = new Logger(MailerProcessor.name);

  constructor(
    private readonly mailerTransportService: MailerTransportService,
    private readonly mailerSchedulerService: MailerSchedulerService,
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type '${job.name}'`);

    switch (job.name) {
      case EmailJobType.IMMEDIATE:
        return this.handleImmediateEmail(job.data as ImmediateEmailData);

      case EmailJobType.TASK_REMINDER:
        return this.handleTaskReminder(job.data as TaskReminderEmailData);

      case EmailJobType.RECURRING_TASK_REMINDER:
        return this.handleRecurringTaskReminder(
          job.data as RecurringTaskReminderEmailData,
        );

      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
        return { success: false, reason: 'Unknown job name' };
    }
  }

  private async handleImmediateEmail(data: ImmediateEmailData): Promise<any> {
    let html = '';

    switch (data.templateType) {
      case 'welcome':
        html = getWelcomeEmailTemplate(
          data.context.name,
          data.context.actionUrl,
        );
        break;

      case 'password-reset':
        html = getPasswordResetEmailTemplate(
          data.context.name,
          data.context.actionUrl ?? '#',
        );
        break;

      case 'custom':
      default:
        html = `<p>${data.context.customBody ?? ''}</p>`;
        break;
    }

    await this.mailerTransportService.sendMail({
      to: data.to,
      subject: data.subject,
      html,
    });

    return { success: true };
  }

  private async handleTaskReminder(data: TaskReminderEmailData): Promise<any> {
    // Stale State Guard: Verify task exists and is not completed
    const taskRepository = this.dataSource.getRepository(Task);
    const task = await taskRepository.findOne({
      where: { id: data.taskId },
    });

    if (!task) {
      this.logger.log(
        `Task ${data.taskId} was deleted. Skipping reminder email.`,
      );
      return { success: true, skipped: true, reason: 'Task deleted' };
    }

    if (task.completedAt !== null) {
      this.logger.log(
        `Task ${data.taskId} is already completed. Skipping reminder email.`,
      );
      return { success: true, skipped: true, reason: 'Task completed' };
    }

    const html = getTaskReminderEmailTemplate(
      data.userName,
      data.taskTitle,
      data.dueTime,
      data.projectName,
    );

    await this.mailerTransportService.sendMail({
      to: data.to,
      subject: `Reminder: ${data.taskTitle}`,
      html,
    });

    return { success: true };
  }

  private async handleRecurringTaskReminder(
    data: RecurringTaskReminderEmailData,
  ): Promise<any> {
    const taskRepository = this.dataSource.getRepository(Task);
    const task = await taskRepository.findOne({
      where: { id: data.taskId },
    });

    if (!task) {
      this.logger.log(
        `Recurring task ${data.taskId} was deleted. Discarding recurrence chain.`,
      );
      return { success: true, skipped: true, reason: 'Task deleted' };
    }

    const html = getRecurringReminderEmailTemplate(
      data.userName,
      data.taskTitle,
      data.occurrenceTime,
    );

    await this.mailerTransportService.sendMail({
      to: data.to,
      subject: `Recurring Reminder: ${data.taskTitle}`,
      html,
    });

    // Next-Occurrence Chaining: Schedule the subsequent occurrence
    await this.mailerSchedulerService.scheduleRecurringTaskReminder({
      taskId: data.taskId,
      userId: data.userId,
      to: data.to,
      userName: data.userName,
      taskTitle: data.taskTitle,
      rruleString: data.rruleString,
      reminderOffsetMinutes: data.reminderOffsetMinutes,
    });

    return { success: true };
  }
}
