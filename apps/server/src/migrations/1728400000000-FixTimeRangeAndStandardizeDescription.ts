import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixTimeRangeAndStandardizeDescription1728400000000 implements MigrationInterface {
  name = 'FixTimeRangeAndStandardizeDescription1728400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Clean up any corrupted degenerate empty ranges in tasks
    await queryRunner.query(`
      UPDATE tasks
      SET time_range = NULL
      WHERE isempty(time_range);
    `);

    // 2. Standardize description column: convert NULL to empty string, set NOT NULL with DEFAULT ''
    await queryRunner.query(`
      UPDATE tasks
      SET description = ''
      WHERE description IS NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE tasks
      ALTER COLUMN description SET DEFAULT '';
    `);

    await queryRunner.query(`
      ALTER TABLE tasks
      ALTER COLUMN description SET NOT NULL;
    `);

    // 3. Update create_task SQL function to prevent degenerate [x, x) empty ranges and ensure description defaults to ''
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION create_task(
          p_owner_id uuid,
          p_task_id uuid,
          p_section_id uuid,
          p_title text,
          p_description text DEFAULT '',
          p_priority text DEFAULT 'high',
          p_time_range_start timestamptz DEFAULT NULL,
          p_time_range_end timestamptz DEFAULT NULL,
          p_label_ids uuid[] DEFAULT ARRAY[]::uuid[]
      )
      RETURNS tasks
      LANGUAGE plpgsql
      AS $$
      DECLARE
          v_last_rank text;
          v_new_rank text;
          v_task tasks;
          v_time_range tstzrange := NULL;
      BEGIN
          IF NOT EXISTS (
              SELECT 1
              FROM sections s
              JOIN projects p ON p.id = s.project_id
              WHERE s.id = p_section_id
                AND p.owner_id = p_owner_id
          ) THEN
              RAISE EXCEPTION
                  'Section % does not exist or does not belong to the user',
                  p_section_id
                  USING ERRCODE = 'P0002';
          END IF;

          PERFORM pg_advisory_xact_lock(
              section_lock_key(p_section_id)
          );

          SELECT t.lexorank
          INTO v_last_rank
          FROM tasks t
          WHERE t.section_id = p_section_id
          ORDER BY t.lexorank COLLATE "C" DESC
          LIMIT 1;

          IF v_last_rank IS NULL THEN
              v_new_rank := 'm';
          ELSE
              BEGIN
                  v_new_rank := lexorank_between(
                      v_last_rank,
                      NULL
                  );
              EXCEPTION WHEN SQLSTATE 'P0001' THEN
                  PERFORM rebalance_section(p_section_id);
                  SELECT t.lexorank INTO v_last_rank
                  FROM tasks t WHERE t.section_id = p_section_id
                  ORDER BY t.lexorank COLLATE "C" DESC LIMIT 1;
                  v_new_rank := lexorank_between(v_last_rank, NULL);
              END;
          END IF;

          -- Prevent degenerate [x, x) empty range by offsetting end by 1 hour if start >= end
          IF p_time_range_start IS NOT NULL AND p_time_range_end IS NOT NULL THEN
              IF p_time_range_start >= p_time_range_end THEN
                  v_time_range := tstzrange(p_time_range_start, p_time_range_start + interval '1 hour', '[)');
              ELSE
                  v_time_range := tstzrange(p_time_range_start, p_time_range_end, '[)');
              END IF;
          END IF;

          INSERT INTO tasks (
              id,
              section_id,
              lexorank,
              title,
              description,
              priority,
              time_range
          )
          VALUES (
              p_task_id,
              p_section_id,
              v_new_rank,
              p_title,
              COALESCE(p_description, ''),
              lower(COALESCE(p_priority, 'high'))::tasks_priority_enum,
              v_time_range
          )
          RETURNING * INTO v_task;

          IF p_label_ids IS NOT NULL AND array_length(p_label_ids, 1) > 0 THEN
              INSERT INTO task_to_task_labels (task_id, task_label_id)
              SELECT
                  p_task_id,
                  l.id
              FROM task_labels l
              WHERE l.id = ANY(p_label_ids)
                AND l.owner_id = p_owner_id;
          END IF;

          RETURN v_task;
      END;
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tasks
      ALTER COLUMN description DROP NOT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE tasks
      ALTER COLUMN description SET DEFAULT NULL;
    `);
  }
}
