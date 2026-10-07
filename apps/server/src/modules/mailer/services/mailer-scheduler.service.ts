import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RRule } from 'rrule';
import {
  EMAIL_QUEUE_NAME,
  EmailJobType,
  ImmediateEmailData,
  TaskReminderEmailData,
  RecurringTaskReminderEmailData,
} from '../mailer.constants';

export interface SendImmediateEmailParams {
  to: string;
  subject: string;
  templateType: 'welcome' | 'password-reset' | 'magic-link' | 'custom';
  context: {
    name: string;
    actionUrl?: string;
    customBody?: string;
  };
}

export interface ScheduleTaskReminderParams {
  taskId: string;
  userId: string;
  to: string;
  userName: string;
  taskTitle: string;
  dueTime: Date;
  reminderTime: Date;
  projectName?: string;
}

export interface ScheduleRecurringTaskReminderParams {
  taskId: string;
  userId: string;
  to: string;
  userName: string;
  taskTitle: string;
  rruleString: string;
  reminderOffsetMinutes: number;
}

@Injectable()
export class MailerSchedulerService {
  private readonly logger = new Logger(MailerSchedulerService.name);

  constructor(
    @InjectQueue(EMAIL_QUEUE_NAME) private readonly emailQueue: Queue,
  ) {}

  /**
   * 1. Send an immediate email asynchronously (Welcome email, Password Reset).
   */
  async sendImmediateEmail(params: SendImmediateEmailParams): Promise<void> {
    const data: ImmediateEmailData = {
      to: params.to,
      subject: params.subject,
      templateType: params.templateType,
      context: params.context,
    };

    await this.emailQueue.add(EmailJobType.IMMEDIATE, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: { age: 3600 },
      removeOnFail: { age: 86400 },
    });

    this.logger.log(`Enqueued immediate email for ${params.to}`);
  }

  /**
   * 2. Schedule a one-time delayed email reminder for a task or event.
   */
  async scheduleTaskReminder(
    params: ScheduleTaskReminderParams,
  ): Promise<void> {
    const delay = params.reminderTime.getTime() - Date.now();
    const jobId = `task-reminder:${params.taskId}`;

    // Cancel existing reminder if present
    await this.cancelTaskReminder(params.taskId);

    if (delay <= 0) {
      this.logger.log(
        `Reminder time for task ${params.taskId} is in the past. Skipping.`,
      );
      return;
    }

    const data: TaskReminderEmailData = {
      taskId: params.taskId,
      userId: params.userId,
      to: params.to,
      userName: params.userName,
      taskTitle: params.taskTitle,
      dueTime: params.dueTime.toISOString(),
      projectName: params.projectName,
    };

    await this.emailQueue.add(EmailJobType.TASK_REMINDER, data, {
      jobId,
      delay,
      removeOnComplete: { age: 3600 },
      removeOnFail: { age: 86400 },
    });

    this.logger.log(
      `Scheduled one-time reminder for task ${params.taskId} in ${Math.round(delay / 1000)}s (JobId: ${jobId})`,
    );
  }

  /**
   * Cancel a scheduled one-time task reminder.
   */
  async cancelTaskReminder(taskId: string): Promise<void> {
    const jobId = `task-reminder:${taskId}`;
    try {
      const job = await this.emailQueue.getJob(jobId);
      if (job) {
        await job.remove();
        this.logger.log(`Cancelled task reminder job ${jobId}`);
      }
    } catch (err) {
      this.logger.warn(`Could not cancel task reminder ${jobId}: ${err}`);
    }
  }

  /**
   * 3. Schedule a recurring email reminder using Next-Occurrence Chaining.
   */
  async scheduleRecurringTaskReminder(
    params: ScheduleRecurringTaskReminderParams,
  ): Promise<void> {
    const jobId = `task-recurring-reminder:${params.taskId}`;

    // Cancel existing recurrence job if present
    await this.cancelRecurringTaskReminder(params.taskId);

    try {
      const rule = RRule.fromString(params.rruleString);
      const now = new Date();
      const nextOccurrence = rule.after(now);

      if (!nextOccurrence) {
        this.logger.log(
          `No upcoming occurrences for recurring task ${params.taskId}.`,
        );
        return;
      }

      const reminderTime = new Date(
        nextOccurrence.getTime() - params.reminderOffsetMinutes * 60 * 1000,
      );
      const delay = reminderTime.getTime() - now.getTime();

      if (delay <= 0) {
        // If the calculated reminder time for the immediate occurrence has passed,
        // search for the subsequent occurrence
        const subsequentOccurrence = rule.after(now, true);
        if (!subsequentOccurrence) return;
      }

      const data: RecurringTaskReminderEmailData = {
        taskId: params.taskId,
        userId: params.userId,
        to: params.to,
        userName: params.userName,
        taskTitle: params.taskTitle,
        occurrenceTime: nextOccurrence.toISOString(),
        rruleString: params.rruleString,
        reminderOffsetMinutes: params.reminderOffsetMinutes,
      };

      await this.emailQueue.add(EmailJobType.RECURRING_TASK_REMINDER, data, {
        jobId,
        delay: Math.max(0, delay),
        removeOnComplete: { age: 3600 },
        removeOnFail: { age: 86400 },
      });

      this.logger.log(
        `Scheduled recurring reminder for task ${params.taskId} at ${nextOccurrence.toISOString()} (JobId: ${jobId})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to schedule recurring reminder for task ${params.taskId}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Cancel a scheduled recurring task reminder.
   */
  async cancelRecurringTaskReminder(taskId: string): Promise<void> {
    const jobId = `task-recurring-reminder:${taskId}`;
    try {
      const job = await this.emailQueue.getJob(jobId);
      if (job) {
        await job.remove();
        this.logger.log(`Cancelled recurring task reminder job ${jobId}`);
      }
    } catch (err) {
      this.logger.warn(
        `Could not cancel recurring task reminder ${jobId}: ${err}`,
      );
    }
  }
}
