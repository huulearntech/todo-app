export const EMAIL_QUEUE_NAME = 'email-queue';

export enum EmailJobType {
  IMMEDIATE = 'send-immediate-email',
  TASK_REMINDER = 'send-task-reminder',
  RECURRING_TASK_REMINDER = 'send-recurring-task-reminder',
}

export interface ImmediateEmailData {
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

export interface TaskReminderEmailData {
  taskId: string;
  reminderId?: string;
  userId: string;
  to: string;
  userName: string;
  taskTitle: string;
  dueTime: string;
  projectName?: string;
  reminderOffsetMinutes?: number;
}

export interface RecurringTaskReminderEmailData {
  taskId: string;
  reminderId?: string;
  userId: string;
  to: string;
  userName: string;
  taskTitle: string;
  occurrenceTime: string;
  rruleString: string;
  reminderOffsetMinutes: number;
  dtstart?: string;
  timezone?: string;
}

export type EmailJobPayload =
  | { type: EmailJobType.IMMEDIATE; data: ImmediateEmailData }
  | { type: EmailJobType.TASK_REMINDER; data: TaskReminderEmailData }
  | {
      type: EmailJobType.RECURRING_TASK_REMINDER;
      data: RecurringTaskReminderEmailData;
    };
