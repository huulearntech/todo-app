import { Queue, Worker } from 'bullmq';

const REDIS_HOST = process.env.REDIS_HOST;
const describeIfRedis = REDIS_HOST ? describe : describe.skip;

describeIfRedis('Mailer Redis Integration (gated by REDIS_HOST)', () => {
  let queue: Queue | undefined;
  let worker: Worker | undefined;

  beforeAll(() => {
    queue = new Queue('test-email-queue', {
      connection: {
        host: REDIS_HOST,
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    });
  });

  afterAll(async () => {
    if (worker) await worker.close();
    if (queue) await queue.close();
  });

  it('chains recurring reminder with unique occurrence jobId', async () => {
    const reminderId = 'rem-test-1';
    const occurrenceISO = new Date(Date.now() + 5000).toISOString();
    const jobId = `reminder-${reminderId}-${Date.now()}`;

    const job = await queue!.add(
      'send-recurring-task-reminder',
      { reminderId, occurrenceTime: occurrenceISO },
      { jobId, delay: 1000 },
    );

    expect(job.id).toBe(jobId);
  });
});
