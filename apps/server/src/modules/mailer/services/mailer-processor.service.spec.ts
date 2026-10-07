import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { MailerProcessor } from './mailer-processor.service';
import { MailerTransportService } from './mailer-transport.service';
import { MailerSchedulerService } from './mailer-scheduler.service';
import { EmailJobType } from '../mailer.constants';

describe('MailerProcessor', () => {
  let processor: MailerProcessor;
  let transportServiceMock: jest.Mocked<Partial<MailerTransportService>>;
  let schedulerServiceMock: jest.Mocked<Partial<MailerSchedulerService>>;
  let dataSourceMock: Partial<DataSource>;

  beforeEach(async () => {
    transportServiceMock = {
      sendMail: jest.fn().mockResolvedValue(undefined),
    };

    schedulerServiceMock = {
      scheduleRecurringTaskReminder: jest.fn().mockResolvedValue(undefined),
    };

    dataSourceMock = {
      getRepository: jest.fn().mockImplementation((entity) => {
        if (entity?.name === 'TaskOccurrence') {
          return {
            findOne: jest.fn().mockResolvedValue(null),
          };
        }
        return {
          findOne: jest.fn().mockResolvedValue({
            id: 'task-1',
            title: 'Test Task',
            completedAt: null,
          }),
        };
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailerProcessor,
        {
          provide: MailerTransportService,
          useValue: transportServiceMock,
        },
        {
          provide: MailerSchedulerService,
          useValue: schedulerServiceMock,
        },
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    processor = module.get<MailerProcessor>(MailerProcessor);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('should process immediate email job', async () => {
    const job = {
      id: 'job-1',
      name: EmailJobType.IMMEDIATE,
      data: {
        to: 'user@example.com',
        subject: 'Welcome',
        templateType: 'welcome',
        context: { name: 'Alice' },
      },
    } as any;

    const result = await processor.process(job);
    expect(result).toEqual({ success: true });
    expect(transportServiceMock.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: 'Welcome',
      }),
    );
  });

  it('should skip task reminder if task is completed', async () => {
    (dataSourceMock.getRepository as jest.Mock).mockReturnValue({
      findOne: jest.fn().mockResolvedValue({
        id: 'task-1',
        title: 'Completed Task',
        completedAt: new Date(),
      }),
    });

    const job = {
      id: 'job-2',
      name: EmailJobType.TASK_REMINDER,
      data: {
        taskId: 'task-1',
        to: 'user@example.com',
        userName: 'Alice',
        taskTitle: 'Completed Task',
        dueTime: new Date().toISOString(),
      },
    } as any;

    const result = await processor.process(job);
    expect(result).toEqual({
      success: true,
      skipped: true,
      reason: 'Task completed',
    });
    expect(transportServiceMock.sendMail).not.toHaveBeenCalled();
  });

  it('should process recurring task reminder and chain next occurrence', async () => {
    const job = {
      id: 'job-3',
      name: EmailJobType.RECURRING_TASK_REMINDER,
      data: {
        taskId: 'task-1',
        userId: 'user-1',
        to: 'user@example.com',
        userName: 'Alice',
        taskTitle: 'Daily Standup',
        occurrenceTime: new Date(Date.now() + 86400000).toISOString(),
        rruleString: 'RRULE:FREQ=DAILY',
        reminderOffsetMinutes: 15,
      },
    } as any;

    const result = await processor.process(job);
    expect(result).toEqual({ success: true });
    expect(transportServiceMock.sendMail).toHaveBeenCalled();
    expect(
      schedulerServiceMock.scheduleRecurringTaskReminder,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 'task-1',
        userId: 'user-1',
      }),
    );
  });
});
