import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EMAIL_QUEUE_NAME } from './mailer.constants';
import { MailerSchedulerService } from './services/mailer-scheduler.service';
import { MailerProcessor } from './services/mailer-processor.service';
import { MailerTransportService } from './services/mailer-transport.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: EMAIL_QUEUE_NAME,
    }),
  ],
  providers: [MailerSchedulerService, MailerProcessor, MailerTransportService],
  exports: [MailerSchedulerService],
})
export class MailerModule {}
