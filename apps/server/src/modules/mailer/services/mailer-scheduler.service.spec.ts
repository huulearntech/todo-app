import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MailerSchedulerService } from './mailer-scheduler.service';
import { EMAIL_QUEUE_NAME, EmailJobType } from '../mailer.constants';

describe('MailerSchedulerService', () => {
  let service: MailerSchedulerService;
  let queueMock: jest.Mocked<Partial<Queue>>;

  beforeEach(async () => {
    queueMock = {
      add: jest.fn().mockResolvedValue({ id: 'job-123' } as any),
      getJob: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailerSchedulerService,
        {
          provide: getQueueToken(EMAIL_QUEUE_NAME),
          useValue: queueMock,
        },
      ],
    }).compile();

    service = module.get<MailerSchedulerService>(MailerSchedulerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendImmediateEmail', () => {
    it('should add an immediate email job to the queue', async () => {
      await service.sendImmediateEmail({
        to: 'user@example.com',
        subject: 'Welcome!',
        templateType: 'welcome',
        context: { name: 'Test User' },
      });

      expect(queueMock.add).toHaveBeenCalledWith(
        EmailJobType.IMMEDIATE,
        {
          to: 'user@example.com',
          subject: 'Welcome!',
          templateType: 'welcome',
          context: { name: 'Test User' },
        },
        expect.objectContaining({ attempts: 3 }),
      );
    });
  });

  describe('scheduleTaskReminder', () => {
    it('should schedule a delayed task reminder job if reminder time is in the future', async () => {
      const futureTime = new Date(Date.now() + 60000);
      const dueTime = new Date(Date.now() + 90000);

      await service.scheduleTaskReminder({
        taskId: 'task-1',
        userId: 'user-1',
        to: 'user@example.com',
        userName: 'Test User',
        taskTitle: 'Important Task',
        dueTime,
        reminderTime: futureTime,
      });

      expect(queueMock.add).toHaveBeenCalledWith(
        EmailJobType.TASK_REMINDER,
        expect.objectContaining({
          taskId: 'task-1',
          taskTitle: 'Important Task',
        }),
        expect.objectContaining({
          jobId: 'task-reminder:task-1',
        }),
      );
    });
  });
});
