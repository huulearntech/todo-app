import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddColorToProjects1728200000000 implements MigrationInterface {
  name = 'AddColorToProjects1728200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "projects"
      ADD COLUMN IF NOT EXISTS "color_hex_code" character varying(7) NOT NULL DEFAULT '#E0E0E0';
    `);

    // Ensure default '#E0E0E0' colors exist for any project owners
    await queryRunner.query(`
      INSERT INTO "colors" ("owner_id", "hex_code", "name")
      SELECT DISTINCT owner_id, '#E0E0E0', 'Grey' FROM "projects"
      ON CONFLICT ("owner_id", "hex_code") DO NOTHING;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_projects_owner_color'
        ) THEN
          ALTER TABLE "projects"
          ADD CONSTRAINT "FK_projects_owner_color"
          FOREIGN KEY ("owner_id", "color_hex_code")
          REFERENCES "colors"("owner_id", "hex_code")
          ON DELETE RESTRICT;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "FK_projects_owner_color";
    `);
    await queryRunner.query(`
      ALTER TABLE "projects" DROP COLUMN IF EXISTS "color_hex_code";
    `);
  }
}
