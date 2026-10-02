import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLexorankTaskFunctions1727860000000 implements MigrationInterface {
  name = 'CreateLexorankTaskFunctions1727860000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop existing standalone index on lexorank if exists
    await queryRunner.query(`
      DO $$
      DECLARE
          r RECORD;
      BEGIN
          FOR r IN (
              SELECT indexname
              FROM pg_indexes
              WHERE tablename = 'tasks'
                AND indexdef LIKE '%(lexorank)%'
                AND indexdef NOT LIKE '%(section_id%'
          ) LOOP
              EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(r.indexname);
          END LOOP;
      END $$;
    `);

    // 2. Create unique index on (section_id, lexorank COLLATE "C")
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS tasks_section_lexorank_uq
      ON tasks (section_id, lexorank COLLATE "C");
    `);

    // 3. Create section_lock_key function
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION section_lock_key(
          p_section_id uuid
      )
      RETURNS bigint
      LANGUAGE sql
      IMMUTABLE
      AS $$
          SELECT hashtextextended(p_section_id::text, 0);
      $$;
    `);

    // 4. Create lexorank_between function
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION lexorank_between(
          p_prev text,
          p_next text
      )
      RETURNS text
      LANGUAGE plpgsql
      IMMUTABLE
      AS $$
      DECLARE
          alphabet CONSTANT text := 'abcdefghijklmnopqrstuvwxyz';
          alphabet_size CONSTANT integer := 26;

          i integer := 1;

          prev_digit integer;
          next_digit integer;

          prev_char text;
          next_char text;

          mid_digit integer;
          result text := '';
      BEGIN
          /*
           * Empty string means "no boundary".
           */
          IF p_prev = '' THEN
              p_prev := NULL;
          END IF;

          IF p_next = '' THEN
              p_next := NULL;
          END IF;

          /*
           * Validate explicit bounds.
           */
          IF p_prev IS NOT NULL
             AND p_next IS NOT NULL
             AND p_prev COLLATE "C" >= p_next COLLATE "C"
          THEN
              RAISE EXCEPTION
                  'Invalid LexoRank bounds: "%" >= "%"',
                  p_prev,
                  p_next
                  USING ERRCODE = '22000';
          END IF;

          LOOP
              prev_char :=
                  CASE
                      WHEN p_prev IS NOT NULL AND i <= length(p_prev)
                      THEN substr(p_prev, i, 1)
                      ELSE NULL
                  END;

              next_char :=
                  CASE
                      WHEN p_next IS NOT NULL AND i <= length(p_next)
                      THEN substr(p_next, i, 1)
                      ELSE NULL
                  END;

              prev_digit :=
                  CASE
                      WHEN prev_char IS NULL THEN 0
                      ELSE strpos(alphabet, prev_char)
                  END;

              next_digit :=
                  CASE
                      WHEN next_char IS NULL THEN alphabet_size + 1
                      ELSE strpos(alphabet, next_char)
                  END;

              IF prev_char IS NOT NULL AND prev_digit = 0 THEN
                  RAISE EXCEPTION
                      'Invalid LexoRank character in previous rank: %',
                      prev_char;
              END IF;

              IF next_char IS NOT NULL AND next_digit = 0 THEN
                  RAISE EXCEPTION
                      'Invalid LexoRank character in next rank: %',
                      next_char;
              END IF;

              IF next_digit - prev_digit > 1 THEN
                  mid_digit := floor(
                      (prev_digit + next_digit)::numeric / 2
                  );

                  RETURN result || substr(alphabet, mid_digit, 1);
              END IF;

              IF prev_char IS NULL THEN
                  RAISE EXCEPTION
                      'LexoRank exhausted between "%" and "%"',
                      COALESCE(p_prev, '<MIN>'),
                      COALESCE(p_next, '<MAX>')
                      USING ERRCODE = 'P0001',
                            HINT = 'Rebalance the section';
              END IF;

              result := result || prev_char;
              i := i + 1;

              IF i > 250 THEN
                  RAISE EXCEPTION
                      'LexoRank exceeded maximum depth'
                      USING ERRCODE = 'P0001',
                            HINT = 'Rebalance the section';
              END IF;
          END LOOP;
      END;
      $$;
    `);

    // 5. Create rebalance_section function
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION rebalance_section(p_section_id uuid)
      RETURNS void
      LANGUAGE plpgsql
      AS $$
      DECLARE
          r RECORD;
          v_alphabet CONSTANT text := 'abcdefghijklmnopqrstuvwxyz';
          v_count integer;
          v_step integer;
          v_idx integer := 0;
          v_val integer;
          v_first_char text;
          v_second_char text;
          v_third_char text;
          v_rank text;
      BEGIN
          PERFORM pg_advisory_xact_lock(section_lock_key(p_section_id));

          SELECT COUNT(*) INTO v_count
          FROM tasks
          WHERE section_id = p_section_id;

          IF v_count = 0 THEN
              RETURN;
          END IF;

          UPDATE tasks
          SET lexorank = 'tmp_' || id::text
          WHERE section_id = p_section_id;

          v_step := floor(17576 / (v_count + 1));
          IF v_step < 1 THEN
              v_step := 1;
          END IF;

          FOR r IN (
              SELECT id FROM tasks
              WHERE section_id = p_section_id
              ORDER BY lexorank COLLATE "C" ASC
          ) LOOP
              v_idx := v_idx + 1;
              v_val := v_idx * v_step;
              IF v_val >= 17576 THEN
                  v_val := 17575;
              END IF;

              v_first_char := substr(v_alphabet, (v_val / 676) + 1, 1);
              v_second_char := substr(v_alphabet, ((v_val % 676) / 26) + 1, 1);
              v_third_char := substr(v_alphabet, (v_val % 26) + 1, 1);
              v_rank := v_first_char || v_second_char || v_third_char;

              UPDATE tasks
              SET lexorank = v_rank
              WHERE id = r.id;
          END LOOP;
      END;
      $$;
    `);

    // 6. Create create_task function
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION create_task(
          p_owner_id uuid,
          p_task_id uuid,
          p_section_id uuid,
          p_title text,
          p_description text DEFAULT NULL,
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

          IF p_time_range_start IS NOT NULL AND p_time_range_end IS NOT NULL THEN
              v_time_range := tstzrange(p_time_range_start, p_time_range_end, '[)');
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
              p_description,
              lower(COALESCE(p_priority, 'high'))::tasks_priority_enum,
              v_time_range
          )
          RETURNING * INTO v_task;

          IF p_label_ids IS NOT NULL AND array_length(p_label_ids, 1) > 0 THEN
              INSERT INTO task_to_task_labels (task_id, task_label_id)
              SELECT p_task_id, unnest(p_label_ids)
              ON CONFLICT DO NOTHING;
          END IF;

          RETURN v_task;
      END;
      $$;
    `);

    // 7. Create move_task function
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION move_task(
          p_owner_id uuid,
          p_task_id uuid,
          p_destination_section_id uuid,
          p_previous_task_id uuid DEFAULT NULL
      )
      RETURNS tasks
      LANGUAGE plpgsql
      AS $$
      DECLARE
          v_task tasks;
          v_previous tasks;
          v_next tasks;

          v_source_section_id uuid;
          v_rank text;

          v_first_section_id uuid;
          v_second_section_id uuid;
      BEGIN
          SELECT t.*
          INTO v_task
          FROM tasks t
          JOIN sections s
            ON s.id = t.section_id
          JOIN projects p
            ON p.id = s.project_id
          WHERE t.id = p_task_id
            AND p.owner_id = p_owner_id;

          IF NOT FOUND THEN
              RAISE EXCEPTION
                  'Task % does not exist or does not belong to the user',
                  p_task_id
                  USING ERRCODE = 'P0002';
          END IF;

          v_source_section_id := v_task.section_id;

          IF NOT EXISTS (
              SELECT 1
              FROM sections s
              JOIN projects p
                ON p.id = s.project_id
              WHERE s.id = p_destination_section_id
                AND p.owner_id = p_owner_id
          ) THEN
              RAISE EXCEPTION
                  'Destination section % does not exist or does not belong to the user',
                  p_destination_section_id
                  USING ERRCODE = 'P0002';
          END IF;

          IF v_source_section_id < p_destination_section_id THEN
              v_first_section_id := v_source_section_id;
              v_second_section_id := p_destination_section_id;
          ELSE
              v_first_section_id := p_destination_section_id;
              v_second_section_id := v_source_section_id;
          END IF;

          PERFORM pg_advisory_xact_lock(
              section_lock_key(v_first_section_id)
          );

          IF v_second_section_id <> v_first_section_id THEN
              PERFORM pg_advisory_xact_lock(
                  section_lock_key(v_second_section_id)
              );
          END IF;

          IF p_previous_task_id IS NOT NULL THEN
              IF p_previous_task_id = p_task_id THEN
                  RAISE EXCEPTION
                      'A task cannot be positioned after itself'
                      USING ERRCODE = '22000';
              END IF;

              SELECT *
              INTO v_previous
              FROM tasks
              WHERE id = p_previous_task_id;

              IF NOT FOUND THEN
                  RAISE EXCEPTION
                      'Previous task % does not exist',
                      p_previous_task_id
                      USING ERRCODE = 'P0002';
              END IF;

              IF v_previous.section_id <> p_destination_section_id THEN
                  RAISE EXCEPTION
                      'Previous task % is not in destination section %',
                      p_previous_task_id,
                      p_destination_section_id
                      USING ERRCODE = '22000';
              END IF;
          END IF;

          IF p_previous_task_id IS NULL THEN
              SELECT *
              INTO v_next
              FROM tasks
              WHERE section_id = p_destination_section_id
                AND id <> p_task_id
              ORDER BY lexorank COLLATE "C" ASC
              LIMIT 1;
          ELSE
              SELECT *
              INTO v_next
              FROM tasks
              WHERE section_id = p_destination_section_id
                AND id <> p_task_id
                AND lexorank COLLATE "C" > v_previous.lexorank COLLATE "C"
              ORDER BY lexorank COLLATE "C" ASC
              LIMIT 1;
          END IF;

          BEGIN
              IF p_previous_task_id IS NULL THEN
                  IF v_next.id IS NULL THEN
                      v_rank := 'm';
                  ELSE
                      v_rank := lexorank_between(
                          NULL,
                          v_next.lexorank
                      );
                  END IF;
              ELSE
                  IF v_next.id IS NULL THEN
                      v_rank := lexorank_between(
                          v_previous.lexorank,
                          NULL
                      );
                  ELSE
                      v_rank := lexorank_between(
                          v_previous.lexorank,
                          v_next.lexorank
                      );
                  END IF;
              END IF;
          EXCEPTION WHEN SQLSTATE 'P0001' THEN
              PERFORM rebalance_section(p_destination_section_id);

              IF p_previous_task_id IS NOT NULL THEN
                  SELECT * INTO v_previous FROM tasks WHERE id = p_previous_task_id;
              END IF;

              IF p_previous_task_id IS NULL THEN
                  SELECT * INTO v_next FROM tasks
                  WHERE section_id = p_destination_section_id AND id <> p_task_id
                  ORDER BY lexorank COLLATE "C" ASC LIMIT 1;

                  IF v_next.id IS NULL THEN
                      v_rank := 'm';
                  ELSE
                      v_rank := lexorank_between(NULL, v_next.lexorank);
                  END IF;
              ELSE
                  SELECT * INTO v_next FROM tasks
                  WHERE section_id = p_destination_section_id AND id <> p_task_id
                    AND lexorank COLLATE "C" > v_previous.lexorank COLLATE "C"
                  ORDER BY lexorank COLLATE "C" ASC LIMIT 1;

                  IF v_next.id IS NULL THEN
                      v_rank := lexorank_between(v_previous.lexorank, NULL);
                  ELSE
                      v_rank := lexorank_between(v_previous.lexorank, v_next.lexorank);
                  END IF;
              END IF;
          END;

          UPDATE tasks
          SET
              section_id = p_destination_section_id,
              lexorank = v_rank
          WHERE id = p_task_id
          RETURNING * INTO v_task;

          RETURN v_task;
      END;
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP FUNCTION IF EXISTS move_task(uuid, uuid, uuid, uuid);',
    );
    await queryRunner.query(
      'DROP FUNCTION IF EXISTS create_task(uuid, uuid, uuid, text, text, text, timestamptz, timestamptz, uuid[]);',
    );
    await queryRunner.query('DROP FUNCTION IF EXISTS rebalance_section(uuid);');
    await queryRunner.query(
      'DROP FUNCTION IF EXISTS lexorank_between(text, text);',
    );
    await queryRunner.query('DROP FUNCTION IF EXISTS section_lock_key(uuid);');
    await queryRunner.query('DROP INDEX IF EXISTS tasks_section_lexorank_uq;');
  }
}
