import { MigrationInterface, QueryRunner } from 'typeorm';

export class SecurityAndDataIntegrityConstraints1728100000000 implements MigrationInterface {
  name = 'SecurityAndDataIntegrityConstraints1728100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add family_id column to refresh_tokens for reuse detection
    await queryRunner.query(`
      ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS family_id uuid;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family_id ON refresh_tokens(family_id);
    `);

    // Backfill family_id for existing tokens if null
    await queryRunner.query(`
      UPDATE refresh_tokens SET family_id = id WHERE family_id IS NULL;
    `);

    // 2. Resolve any existing duplicate active goals
    await queryRunner.query(`
      WITH ranked_goals AS (
        SELECT id,
               ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY effective_from DESC, created_at DESC) as rn
        FROM user_goals
        WHERE effective_to IS NULL
      )
      UPDATE user_goals
      SET effective_to = NOW()
      WHERE id IN (SELECT id FROM ranked_goals WHERE rn > 1);
    `);

    // Create partial unique index on active user goals
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_user_goals_active ON user_goals (user_id) WHERE effective_to IS NULL;
    `);

    // 3. Resolve any duplicate completed task occurrences
    await queryRunner.query(`
      WITH ranked_occurrences AS (
        SELECT id,
               ROW_NUMBER() OVER(PARTITION BY task_id, scheduled_date ORDER BY completed_at DESC, created_at DESC) as rn
        FROM task_occurrences
        WHERE status = 'completed' AND scheduled_date IS NOT NULL
      )
      DELETE FROM task_occurrences
      WHERE id IN (SELECT id FROM ranked_occurrences WHERE rn > 1);
    `);

    // Create partial unique index for completed occurrences
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_task_occurrences_completed
      ON task_occurrences (task_id, scheduled_date)
      WHERE status = 'completed' AND scheduled_date IS NOT NULL;
    `);

    // 4. Add foreign key from users.default_project_id to projects.id (ON DELETE RESTRICT, DEFERRABLE)
    await queryRunner.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_default_project'
          ) THEN
              ALTER TABLE users
              ADD CONSTRAINT fk_users_default_project
              FOREIGN KEY (default_project_id) REFERENCES projects(id)
              ON DELETE RESTRICT
              DEFERRABLE INITIALLY DEFERRED;
          END IF;
      END $$;
    `);

    // 5. Backfill default goals for users missing one
    await queryRunner.query(`
      INSERT INTO user_goals (id, user_id, daily_goal, weekly_goal, effective_from, effective_to, created_at, updated_at)
      SELECT gen_random_uuid(), u.id, 5, 20, NOW(), NULL, NOW(), NOW()
      FROM users u
      WHERE NOT EXISTS (
        SELECT 1 FROM user_goals ug WHERE ug.user_id = u.id AND ug.effective_to IS NULL
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_default_project;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS uq_task_occurrences_completed;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS uq_user_goals_active;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_refresh_tokens_family_id;
    `);

    await queryRunner.query(`
      ALTER TABLE refresh_tokens DROP COLUMN IF EXISTS family_id;
    `);
  }
}
