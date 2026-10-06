interface BaseTemplateOptions {
  title: string;
  contentHtml: string;
}

function baseEmailTemplate({
  title,
  contentHtml,
}: BaseTemplateOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f5f7;
      margin: 0;
      padding: 20px;
      color: #333333;
    }
    .card {
      max-width: 560px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      border: 1px solid #e1e4e8;
    }
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      padding: 24px 32px;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 600;
    }
    .body {
      padding: 32px;
      line-height: 1.6;
      font-size: 15px;
    }
    .button {
      display: inline-block;
      background-color: #4f46e5;
      color: #ffffff !important;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 20px;
      margin-bottom: 20px;
    }
    .footer {
      background: #f9fafb;
      padding: 16px 32px;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
      border-top: 1px solid #f3f4f6;
    }
    .highlight-box {
      background: #f0fdf4;
      border-left: 4px solid #22c55e;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Todo App</h1>
    </div>
    <div class="body">
      ${contentHtml}
    </div>
    <div class="footer">
      <p>This is an automated notification from your Todo App.</p>
    </div>
  </div>
</body>
</html>`;
}

export function getWelcomeEmailTemplate(
  name: string,
  actionUrl?: string,
): string {
  const buttonHtml = actionUrl
    ? `<a href="${actionUrl}" class="button">Verify Email Account</a>`
    : '';

  return baseEmailTemplate({
    title: 'Welcome to Todo App!',
    contentHtml: `
      <h2>Welcome, ${name}!</h2>
      <p>Thank you for joining Todo App. We are excited to help you organize your daily tasks, stay focused, and achieve your goals effortlessly.</p>
      ${buttonHtml}
      <p>If you have any questions or feedback, feel free to reply to this email.</p>
    `,
  });
}

export function getPasswordResetEmailTemplate(
  name: string,
  resetUrl: string,
): string {
  return baseEmailTemplate({
    title: 'Reset your password',
    contentHtml: `
      <h2>Password Reset Request</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your password for your Todo App account.</p>
      <p>Click the button below to choose a new password:</p>
      <a href="${resetUrl}" class="button">Reset Password</a>
      <p>If you did not request a password reset, you can safely ignore this email.</p>
    `,
  });
}

export function getTaskReminderEmailTemplate(
  userName: string,
  taskTitle: string,
  dueTime: string,
  projectName?: string,
): string {
  const projectInfo = projectName
    ? `<p><strong>Project:</strong> ${projectName}</p>`
    : '';

  return baseEmailTemplate({
    title: `Task Reminder: ${taskTitle}`,
    contentHtml: `
      <h2>Task Reminder</h2>
      <p>Hi ${userName},</p>
      <p>This is a reminder for your upcoming task:</p>
      <div class="highlight-box">
        <h3 style="margin-top:0;">${taskTitle}</h3>
        <p><strong>Scheduled Time:</strong> ${dueTime}</p>
        ${projectInfo}
      </div>
      <p>Stay productive!</p>
    `,
  });
}

export function getRecurringReminderEmailTemplate(
  userName: string,
  taskTitle: string,
  occurrenceTime: string,
): string {
  return baseEmailTemplate({
    title: `Recurring Task Reminder: ${taskTitle}`,
    contentHtml: `
      <h2>Recurring Task Reminder</h2>
      <p>Hi ${userName},</p>
      <p>You have an occurrence of your recurring task coming up:</p>
      <div class="highlight-box">
        <h3 style="margin-top:0;">${taskTitle}</h3>
        <p><strong>Occurrence Time:</strong> ${occurrenceTime}</p>
      </div>
      <p>Keep up the momentum!</p>
    `,
  });
}
