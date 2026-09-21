import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MailerSchedulerService } from './services/mailer-scheduler.service';
import { MailerProcessor } from './services/mailer-processor.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email-queue',
    }),
  ],
  providers: [MailerSchedulerService, MailerProcessor],
  exports: [MailerSchedulerService],
})
export class MailerModule {}
