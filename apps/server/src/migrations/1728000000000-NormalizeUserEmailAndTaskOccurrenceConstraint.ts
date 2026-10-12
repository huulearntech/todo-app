import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeUserEmailAndTaskOccurrenceConstraint1728000000000
  implements MigrationInterface
{
  name = 'NormalizeUserEmailAndTaskOccurrenceConstraint1728000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Normalize existing user emails to lower case
    await queryRunner.query(`
      UPDATE users SET email = LOWER(email);
    `);

    // 2. Create unique index on LOWER(email)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS users_lower_email_idx ON users (LOWER(email));
    `);

    // 3. Backfill any corrupt legacy records where completed_at is NULL despite being completed
    await queryRunner.query(`
      UPDATE task_occurrences
      SET completed_at = COALESCE(updated_at, created_at, NOW())
      WHERE status = 'completed' AND completed_at IS NULL;
    `);

    // 4. Add check constraint ensuring completed occurrences always have completed_at
    await queryRunner.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'chk_task_occurrences_completed_at'
          ) THEN
              ALTER TABLE task_occurrences
              ADD CONSTRAINT chk_task_occurrences_completed_at
              CHECK (status <> 'completed' OR completed_at IS NOT NULL);
          END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE task_occurrences DROP CONSTRAINT IF EXISTS chk_task_occurrences_completed_at;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS users_lower_email_idx;
    `);
  }
}
