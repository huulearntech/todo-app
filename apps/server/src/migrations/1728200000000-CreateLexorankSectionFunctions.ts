import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLexorankSectionFunctions1728200000000 implements MigrationInterface {
  name = 'CreateLexorankSectionFunctions1728200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 0. Drop obsolete legacy functions if they exist
    await queryRunner.query(
      'DROP FUNCTION IF EXISTS create_section(uuid, uuid, uuid, text, text, text);',
    );
    await queryRunner.query(
      'DROP FUNCTION IF EXISTS move_section(uuid, uuid, uuid);',
    );

    // 1. Rebalance/normalize any sections with ties or missing ranks so unique constraint will succeed
    await queryRunner.query(`
      DO $$
      DECLARE
          p RECORD;
          s RECORD;
          v_alphabet CONSTANT text := 'abcdefghijklmnopqrstuvwxyz';
          v_step integer;
          v_idx integer;
          v_val integer;
          v_first_char text;
          v_second_char text;
          v_third_char text;
          v_rank text;
      BEGIN
          FOR p IN (SELECT DISTINCT project_id FROM sections) LOOP
              v_idx := 0;
              SELECT COUNT(*) INTO v_step FROM sections WHERE project_id = p.project_id;
              IF v_step > 0 THEN
                  v_step := floor(17576 / (v_step + 1));
                  IF v_step < 1 THEN v_step := 1; END IF;
                  FOR s IN (
                      SELECT id FROM sections
                      WHERE project_id = p.project_id
                      ORDER BY lexorank COLLATE "C" ASC, created_at ASC
                  ) LOOP
                      v_idx := v_idx + 1;
                      v_val := v_idx * v_step;
                      IF v_val >= 17576 THEN v_val := 17575; END IF;
                      v_first_char := substr(v_alphabet, (v_val / 676) + 1, 1);
                      v_second_char := substr(v_alphabet, ((v_val % 676) / 26) + 1, 1);
                      v_third_char := substr(v_alphabet, (v_val % 26) + 1, 1);
                      v_rank := v_first_char || v_second_char || v_third_char;
                      UPDATE sections SET lexorank = v_rank WHERE id = s.id;
                  END LOOP;
              END IF;
          END LOOP;
      END $$;
    `);

    // 2. Create unique index on (project_id, lexorank COLLATE "C")
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS sections_project_lexorank_uq
      ON sections (project_id, lexorank COLLATE "C");
    `);

    // 3. Create project_lock_key function
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION project_lock_key(
          p_project_id uuid
      )
      RETURNS bigint
      LANGUAGE sql
      IMMUTABLE
      AS $$
          SELECT hashtextextended(p_project_id::text, 0);
      $$;
    `);

    // 4. Create rebalance_project_sections function
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION rebalance_project_sections(p_project_id uuid)
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
          PERFORM pg_advisory_xact_lock(project_lock_key(p_project_id));

          SELECT COUNT(*) INTO v_count
          FROM sections
          WHERE project_id = p_project_id;

          IF v_count = 0 THEN
              RETURN;
          END IF;

          UPDATE sections
          SET lexorank = 'tmp_' || id::text
          WHERE project_id = p_project_id;

          v_step := floor(17576 / (v_count + 1));
          IF v_step < 1 THEN
              v_step := 1;
          END IF;

          FOR r IN (
              SELECT id FROM sections
              WHERE project_id = p_project_id
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

              UPDATE sections
              SET lexorank = v_rank
              WHERE id = r.id;
          END LOOP;
      END;
      $$;
    `);

    // 5. Create next_section_lexorank function
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION next_section_lexorank(p_project_id uuid)
      RETURNS text
      LANGUAGE plpgsql
      AS $$
      DECLARE
          v_last_rank text;
      BEGIN
          PERFORM pg_advisory_xact_lock(project_lock_key(p_project_id));

          SELECT s.lexorank
          INTO v_last_rank
          FROM sections s
          WHERE s.project_id = p_project_id
          ORDER BY s.lexorank COLLATE "C" DESC
          LIMIT 1;

          IF v_last_rank IS NULL THEN
              RETURN 'm';
          ELSE
              BEGIN
                  RETURN lexorank_between(v_last_rank, NULL);
              EXCEPTION WHEN SQLSTATE 'P0001' THEN
                  PERFORM rebalance_project_sections(p_project_id);
                  SELECT s.lexorank INTO v_last_rank
                  FROM sections s WHERE s.project_id = p_project_id
                  ORDER BY s.lexorank COLLATE "C" DESC LIMIT 1;
                  RETURN lexorank_between(v_last_rank, NULL);
              END;
          END IF;
      END;
      $$;
    `);

    // 6. Create move_section_lexorank function
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION move_section_lexorank(
          p_section_id uuid,
          p_previous_section_id uuid DEFAULT NULL
      )
      RETURNS text
      LANGUAGE plpgsql
      AS $$
      DECLARE
          v_section sections;
          v_previous sections;
          v_next sections;
          v_project_id uuid;
          v_rank text;
      BEGIN
          SELECT s.*
          INTO v_section
          FROM sections s
          WHERE s.id = p_section_id;

          IF NOT FOUND THEN
              RAISE EXCEPTION
                  'Section % does not exist',
                  p_section_id
                  USING ERRCODE = 'P0002';
          END IF;

          v_project_id := v_section.project_id;

          PERFORM pg_advisory_xact_lock(
              project_lock_key(v_project_id)
          );

          IF p_previous_section_id IS NOT NULL THEN
              IF p_previous_section_id = p_section_id THEN
                  RAISE EXCEPTION
                      'A section cannot be positioned after itself'
                      USING ERRCODE = '22000';
              END IF;

              SELECT *
              INTO v_previous
              FROM sections
              WHERE id = p_previous_section_id;

              IF NOT FOUND THEN
                  RAISE EXCEPTION
                      'Previous section % does not exist',
                      p_previous_section_id
                      USING ERRCODE = 'P0002';
              END IF;

              IF v_previous.project_id <> v_project_id THEN
                  RAISE EXCEPTION
                      'Previous section % is not in project %',
                      p_previous_section_id,
                      v_project_id
                      USING ERRCODE = '22000';
              END IF;

              SELECT *
              INTO v_next
              FROM sections
              WHERE project_id = v_project_id
                AND id <> p_section_id
                AND lexorank COLLATE "C" > v_previous.lexorank COLLATE "C"
              ORDER BY lexorank COLLATE "C" ASC
              LIMIT 1;

              BEGIN
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
              EXCEPTION WHEN SQLSTATE 'P0001' THEN
                  PERFORM rebalance_project_sections(v_project_id);
                  SELECT * INTO v_previous FROM sections WHERE id = p_previous_section_id;
                  SELECT * INTO v_next FROM sections
                  WHERE project_id = v_project_id
                    AND id <> p_section_id
                    AND lexorank COLLATE "C" > v_previous.lexorank COLLATE "C"
                  ORDER BY lexorank COLLATE "C" ASC
                  LIMIT 1;

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
              END;
          ELSE
              SELECT *
              INTO v_next
              FROM sections
              WHERE project_id = v_project_id
                AND id <> p_section_id
              ORDER BY lexorank COLLATE "C" ASC
              LIMIT 1;

              IF v_next.id IS NULL THEN
                  v_rank := 'm';
              ELSE
                  BEGIN
                      v_rank := lexorank_between(
                          NULL,
                          v_next.lexorank
                      );
                  EXCEPTION WHEN SQLSTATE 'P0001' THEN
                      PERFORM rebalance_project_sections(v_project_id);
                      SELECT * INTO v_next FROM sections
                      WHERE project_id = v_project_id
                        AND id <> p_section_id
                      ORDER BY lexorank COLLATE "C" ASC
                      LIMIT 1;
                      v_rank := lexorank_between(NULL, v_next.lexorank);
                  END;
              END IF;
          END IF;

          UPDATE sections
          SET lexorank = v_rank
          WHERE id = p_section_id;

          RETURN v_rank;
      END;
      $$;
    `);

    // 7. Create BEFORE INSERT trigger on sections
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION trg_set_section_lexorank()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      BEGIN
          IF NEW.lexorank IS NULL OR NEW.lexorank = '' THEN
              NEW.lexorank := next_section_lexorank(NEW.project_id);
          END IF;
          RETURN NEW;
      END;
      $$;

      DROP TRIGGER IF EXISTS trg_section_before_insert ON sections;
      CREATE TRIGGER trg_section_before_insert
      BEFORE INSERT ON sections
      FOR EACH ROW
      EXECUTE FUNCTION trg_set_section_lexorank();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP TRIGGER IF EXISTS trg_section_before_insert ON sections;',
    );
    await queryRunner.query(
      'DROP FUNCTION IF EXISTS trg_set_section_lexorank();',
    );
    await queryRunner.query(
      'DROP FUNCTION IF EXISTS move_section_lexorank(uuid, uuid);',
    );
    await queryRunner.query(
      'DROP FUNCTION IF EXISTS next_section_lexorank(uuid);',
    );
    await queryRunner.query(
      'DROP FUNCTION IF EXISTS rebalance_project_sections(uuid);',
    );
    await queryRunner.query('DROP FUNCTION IF EXISTS project_lock_key(uuid);');
    await queryRunner.query(
      'DROP INDEX IF EXISTS sections_project_lexorank_uq;',
    );
  }
}
