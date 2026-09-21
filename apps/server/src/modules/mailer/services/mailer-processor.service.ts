import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';

@Processor('email-queue')
@Injectable()
export class MailerProcessor extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    const { userId, to, subject, body } = job.data;
    
    console.log(`Processing email job for user ${userId} at ${new Date().toISOString()}`);
    
    // Execute your transactional mailing code here (e.g., Nodemailer, Resend, SendGrid)
    // await this.emailService.sendRealEmail(to, subject, body);
    
    return { success: true };
  }
}
