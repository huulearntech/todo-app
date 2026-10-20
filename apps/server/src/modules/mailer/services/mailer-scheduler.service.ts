import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { parseRRuleString } from '@todo/shared';
import { calculateNextOccurrence } from '../../tasks/utils/recurrence.util';
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
  templateType: 'welcome' | 'password-reset' | 'magic-link' | 'project-invitation' | 'custom';
  context: {
    name: string;
    actionUrl?: string;
    customBody?: string;
    projectName?: string;
    role?: string;
  };
}

export interface ScheduleTaskReminderParams {
  taskId: string;
  reminderId?: string;
  userId: string;
  to: string;
  userName: string;
  taskTitle: string;
  dueTime: Date;
  reminderTime: Date;
  projectName?: string;
  reminderOffsetMinutes?: number;
}

export interface ScheduleRecurringTaskReminderParams {
  taskId: string;
  reminderId?: string;
  userId: string;
  to: string;
  userName: string;
  taskTitle: string;
  rruleString: string;
  reminderOffsetMinutes: number;
  dtstart?: Date;
  timezone?: string;
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
    const identifier = params.reminderId || params.taskId;
    const jobId = `task-reminder-${identifier}`;

    // Cancel existing reminder if present
    await this.cancelTaskReminder(identifier);

    if (delay <= 0) {
      this.logger.log(
        `Reminder time for task ${params.taskId} (${identifier}) is in the past. Skipping.`,
      );
      return;
    }

    const data: TaskReminderEmailData = {
      taskId: params.taskId,
      reminderId: params.reminderId,
      userId: params.userId,
      to: params.to,
      userName: params.userName,
      taskTitle: params.taskTitle,
      dueTime: params.dueTime.toISOString(),
      projectName: params.projectName,
      reminderOffsetMinutes: params.reminderOffsetMinutes,
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
  async cancelTaskReminder(identifier: string): Promise<void> {
    const jobId = `task-reminder-${identifier}`;
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
    const identifier = params.reminderId || params.taskId;

    // Cancel existing recurrence jobs for this identifier if present
    await this.cancelRecurringTaskReminder(identifier);

    try {
      const now = new Date();
      const dtstart = params.dtstart ?? now;
      const zone = params.timezone ?? 'UTC';
      const parsedRule = parseRRuleString(params.rruleString);

      let currentAnchor = now;
      let targetOccurrence: Date | null = null;
      let delay = 0;

      for (let i = 0; i < 50; i++) {
        const nextOccurrence = calculateNextOccurrence(
          parsedRule,
          currentAnchor,
          dtstart,
          zone,
        );

        if (!nextOccurrence) break;

        const reminderTime = new Date(
          nextOccurrence.getTime() - params.reminderOffsetMinutes * 60 * 1000,
        );
        const calculatedDelay = reminderTime.getTime() - now.getTime();

        if (calculatedDelay > 0) {
          targetOccurrence = nextOccurrence;
          delay = calculatedDelay;
          break;
        }

        currentAnchor = nextOccurrence;
      }

      if (!targetOccurrence) {
        this.logger.log(
          `No upcoming future occurrences for recurring task ${params.taskId}.`,
        );
        return;
      }

      const occurrenceISO = targetOccurrence.toISOString();
      const jobId = `reminder-${identifier}-${targetOccurrence.getTime()}`;

      const data: RecurringTaskReminderEmailData = {
        taskId: params.taskId,
        reminderId: params.reminderId,
        userId: params.userId,
        to: params.to,
        userName: params.userName,
        taskTitle: params.taskTitle,
        occurrenceTime: occurrenceISO,
        rruleString: params.rruleString,
        reminderOffsetMinutes: params.reminderOffsetMinutes,
        dtstart: dtstart.toISOString(),
        timezone: zone,
      };

      await this.emailQueue.add(EmailJobType.RECURRING_TASK_REMINDER, data, {
        jobId,
        delay,
        removeOnComplete: { age: 3600 },
        removeOnFail: { age: 86400 },
      });

      this.logger.log(
        `Scheduled recurring reminder for task ${params.taskId} at ${occurrenceISO} (JobId: ${jobId})`,
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
  async cancelRecurringTaskReminder(identifier: string): Promise<void> {
    const legacyJobId = `task-recurring-reminder-${identifier}`;
    const prefix = `reminder-${identifier}-`;
    try {
      const job = await this.emailQueue.getJob(legacyJobId);
      if (job) {
        await job.remove();
        this.logger.log(`Cancelled recurring task reminder job ${legacyJobId}`);
      }
      const delayedJobs = await this.emailQueue.getJobs(['delayed', 'waiting']);
      for (const j of delayedJobs) {
        if (j.id?.startsWith(prefix) || j.id === legacyJobId) {
          await j.remove().catch(() => {});
          this.logger.log(`Cancelled recurring task reminder job ${j.id}`);
        }
      }
    } catch (err) {
      this.logger.warn(
        `Could not cancel recurring task reminder ${identifier}: ${err}`,
      );
    }
  }
}
