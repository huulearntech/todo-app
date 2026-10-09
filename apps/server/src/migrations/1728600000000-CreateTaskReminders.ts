import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTaskReminders1728600000000 implements MigrationInterface {
  name = 'CreateTaskReminders1728600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS task_reminders (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        task_id uuid NOT NULL,
        user_id uuid NOT NULL,
        type varchar(32) NOT NULL DEFAULT 'relative',
        minute_offset integer DEFAULT 30,
        remind_at timestamptz(3),
        channel varchar(32) NOT NULL DEFAULT 'email',
        created_at timestamptz(3) NOT NULL DEFAULT now(),
        updated_at timestamptz(3) NOT NULL DEFAULT now(),
        CONSTRAINT pk_task_reminders PRIMARY KEY (id),
        CONSTRAINT fk_task_reminders_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        CONSTRAINT fk_task_reminders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_task_reminders_task_id ON task_reminders(task_id);
      CREATE INDEX IF NOT EXISTS idx_task_reminders_user_id ON task_reminders(user_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS task_reminders CASCADE;`);
  }
}
