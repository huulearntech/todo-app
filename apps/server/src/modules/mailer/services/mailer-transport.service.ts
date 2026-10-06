import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import { TypedConfigService } from '@/src/config/typed-config.service';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class MailerTransportService implements OnModuleInit {
  private readonly logger = new Logger(MailerTransportService.name);
  private transporter!: Transporter;
  private defaultFrom = 'Todo App <noreply@todo.app>';

  constructor(private readonly configService: TypedConfigService) {}

  async onModuleInit(): Promise<void> {
    const mailHost = this.configService.get('MAIL_HOST');
    const mailPort = this.configService.get('MAIL_PORT');
    const mailUser = this.configService.get('MAIL_USER');
    const mailPass = this.configService.get('MAIL_PASS');
    const mailFrom = this.configService.get('MAIL_FROM');

    if (mailFrom) {
      this.defaultFrom = mailFrom;
    }

    if (mailHost && mailPort) {
      this.logger.log(
        `Initializing SMTP transport for host: ${mailHost}:${mailPort}`,
      );
      this.transporter = nodemailer.createTransport({
        host: mailHost,
        port: mailPort,
        secure: mailPort === 465,
        auth:
          mailUser && mailPass ? { user: mailUser, pass: mailPass } : undefined,
      });
    } else {
      this.logger.log(
        'No MAIL_HOST configured. Creating Ethereal sandbox test account for development...',
      );
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        this.logger.log(
          `Ethereal test account created! Username: ${testAccount.user}`,
        );
      } catch (err) {
        this.logger.warn(
          `Failed to create Ethereal test account: ${err}. Falling back to JSON log transporter.`,
        );
        this.transporter = nodemailer.createTransport({
          jsonTransport: true,
        });
      }
    }
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.defaultFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      this.logger.log(
        `Email sent successfully to ${options.to}. MessageId: ${info.messageId}`,
      );
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        this.logger.log(`[Ethereal Preview URL]: ${previewUrl}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}
