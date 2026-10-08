import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTaskOccurrencesAndBackfill1728500000000 implements MigrationInterface {
  name = 'CreateTaskOccurrencesAndBackfill1728500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create enum if not exists
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_occurrences_status_enum') THEN
          CREATE TYPE task_occurrences_status_enum AS ENUM ('pending', 'completed', 'skipped');
        END IF;
      END
      $$;
    `);

    // 2. Create table if not exists
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS task_occurrences (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        task_id uuid NOT NULL,
        user_id uuid NOT NULL,
        scheduled_date timestamptz(3),
        status task_occurrences_status_enum NOT NULL DEFAULT 'pending',
        completed_at timestamptz(3),
        created_at timestamptz(3) NOT NULL DEFAULT now(),
        updated_at timestamptz(3) NOT NULL DEFAULT now(),
        CONSTRAINT pk_task_occurrences PRIMARY KEY (id),
        CONSTRAINT fk_task_occurrences_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        CONSTRAINT fk_task_occurrences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // 3. Create indexes if not exist
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_task_occurrences_user_completed_at ON task_occurrences(user_id, completed_at);
      CREATE INDEX IF NOT EXISTS idx_task_occurrences_task_id ON task_occurrences(task_id);
      CREATE INDEX IF NOT EXISTS idx_task_occurrences_task_scheduled ON task_occurrences(task_id, scheduled_date);
    `);

    // 4. Backfill completed occurrences for historical completed tasks
    await queryRunner.query(`
      INSERT INTO task_occurrences (id, task_id, user_id, scheduled_date, status, completed_at, created_at, updated_at)
      SELECT
        gen_random_uuid(),
        t.id,
        p.owner_id,
        CASE WHEN t.time_range IS NOT NULL THEN lower(t.time_range) ELSE NULL END,
        'completed'::task_occurrences_status_enum,
        t.completed_at,
        COALESCE(t.completed_at, now()),
        COALESCE(t.completed_at, now())
      FROM tasks t
      INNER JOIN sections s ON s.id = t.section_id
      INNER JOIN projects p ON p.id = s.project_id
      WHERE t.completed_at IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM task_occurrences o
          WHERE o.task_id = t.id AND o.status = 'completed'
        );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS task_occurrences CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS task_occurrences_status_enum;`);
  }
}
