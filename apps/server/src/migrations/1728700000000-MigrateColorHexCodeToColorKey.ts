import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateColorHexCodeToColorKey1728700000000 implements MigrationInterface {
  name = 'MigrateColorHexCodeToColorKey1728700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop existing FK constraints on projects and task_labels
    await queryRunner.query(`
      ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "FK_projects_owner_color";
      ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "FK_projects_color";
      ALTER TABLE "task_labels" DROP CONSTRAINT IF EXISTS "FK_task_labels_owner_color";
      ALTER TABLE "task_labels" DROP CONSTRAINT IF EXISTS "FK_task_labels_color";
    `);

    // 2. Update projects table
    await queryRunner.query(`
      ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "color_key" character varying(50) NOT NULL DEFAULT 'slate';
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'color_hex_code'
        ) THEN
          UPDATE "projects" SET "color_key" = CASE
            WHEN "color_hex_code" = '#EF4444' THEN 'red'
            WHEN "color_hex_code" = '#F59E0B' THEN 'amber'
            WHEN "color_hex_code" = '#10B981' THEN 'emerald'
            WHEN "color_hex_code" = '#3B82F6' THEN 'sky'
            WHEN "color_hex_code" = '#8B5CF6' THEN 'violet'
            ELSE 'slate'
          END;
          ALTER TABLE "projects" DROP COLUMN "color_hex_code";
        END IF;
      END $$;
    `);

    // 3. Update task_labels table
    await queryRunner.query(`
      ALTER TABLE "task_labels" ADD COLUMN IF NOT EXISTS "color_key" character varying(50) NOT NULL DEFAULT 'slate';
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns WHERE table_name = 'task_labels' AND column_name = 'color_hex_code'
        ) THEN
          UPDATE "task_labels" SET "color_key" = CASE
            WHEN "color_hex_code" = '#EF4444' THEN 'red'
            WHEN "color_hex_code" = '#F59E0B' THEN 'amber'
            WHEN "color_hex_code" = '#10B981' THEN 'emerald'
            WHEN "color_hex_code" = '#3B82F6' THEN 'sky'
            WHEN "color_hex_code" = '#8B5CF6' THEN 'violet'
            ELSE 'slate'
          END;
          ALTER TABLE "task_labels" DROP COLUMN "color_hex_code";
        END IF;
      END $$;
    `);

    // 4. Recreate colors table cleanly with owner_id and key as composite PK
    await queryRunner.query(`DROP TABLE IF EXISTS "colors" CASCADE;`);
    await queryRunner.query(`
      CREATE TABLE "colors" (
        "owner_id" uuid NOT NULL,
        "key" character varying(50) NOT NULL,
        "name" character varying(100) NOT NULL,
        CONSTRAINT "PK_colors_owner_key" PRIMARY KEY ("owner_id", "key"),
        CONSTRAINT "FK_colors_owner_id" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    // 5. Seed default colors for existing users
    const defaultColors = [
      { key: 'slate', name: 'Slate' },
      { key: 'red', name: 'Red' },
      { key: 'amber', name: 'Amber' },
      { key: 'emerald', name: 'Emerald' },
      { key: 'sky', name: 'Sky Blue' },
      { key: 'indigo', name: 'Indigo' },
      { key: 'violet', name: 'Violet' },
    ];

    for (const c of defaultColors) {
      await queryRunner.query(`
        INSERT INTO "colors" ("owner_id", "key", "name")
        SELECT id, '${c.key}', '${c.name}' FROM "users"
        ON CONFLICT ("owner_id", "key") DO NOTHING;
      `);
    }

    // 6. Re-add FK constraints
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_projects_owner_color') THEN
          ALTER TABLE "projects"
          ADD CONSTRAINT "FK_projects_owner_color"
          FOREIGN KEY ("owner_id", "color_key")
          REFERENCES "colors"("owner_id", "key")
          ON DELETE RESTRICT;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_task_labels_owner_color') THEN
          ALTER TABLE "task_labels"
          ADD CONSTRAINT "FK_task_labels_owner_color"
          FOREIGN KEY ("owner_id", "color_key")
          REFERENCES "colors"("owner_id", "key")
          ON DELETE RESTRICT;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "FK_projects_owner_color";`);
    await queryRunner.query(`ALTER TABLE "task_labels" DROP CONSTRAINT IF EXISTS "FK_task_labels_owner_color";`);
  }
}
