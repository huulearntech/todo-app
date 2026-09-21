import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class MailerSchedulerService {
  constructor(@InjectQueue('email-queue') private emailQueue: Queue) {}

  // 1. One-time future email (Giữ nguyên cấu hình add vì là công việc chạy 1 lần)
  async scheduleOneTimeEmail(userId: string, emailData: any, delayMs: number) {
    await this.emailQueue.add(
      'send-email',
      { userId, ...emailData },
      { 
        delay: delayMs,
        // Tiêu chuẩn mới khuyên dùng đối tượng cấu hình chi tiết cho việc dọn dẹp bộ nhớ
        removeOnComplete: { age: 3600 }, // Xóa sau 1 giờ hoàn thành để tránh phình dữ liệu Redis
        removeOnFail: { age: 86400 },   // Giữ lại log lỗi trong 24 giờ để debug
      }
    );
  }

  // 2. Recurrent email (Được cập nhật theo tiêu chuẩn mới sử dụng Job Schedulers)
  async scheduleRecurrentEmail(userId: string, emailData: any, cronPattern: string) {
    // Định danh scheduler duy nhất theo từng user để tránh trùng lặp hoặc ghi đè sai lịch
    const schedulerId = `scheduler-email-${userId}`;

    await this.emailQueue.upsertJobScheduler(
      schedulerId,
      {
        pattern: cronPattern, // Ví dụ: '30 8 * * 1' (Chạy lúc 8:30 sáng thứ Hai - trước sự kiện 9:00 30 phút)
        // tz: 'Asia/Ho_Chi_Minh' // Nên cấu hình múi giờ cố định để tránh lệch giờ khi deploy cloud
      },
      {
        name: 'send-email',
        data: { userId, ...emailData },
        opts: {
          // Cấu hình dọn dẹp các job con do scheduler này sinh ra sau khi chạy xong
          removeOnComplete: true,
          removeOnFail: { count: 10 } 
        }
      }
    );
  }

  // HÀM BỔ SUNG: Hủy lịch nhắc nhở định kỳ (Rất cần thiết khi user xóa sự kiện)
  async removeRecurrentEmail(userId: string) {
    const schedulerId = `scheduler-email-${userId}`;
    await this.emailQueue.removeJobScheduler(schedulerId);
  }
}