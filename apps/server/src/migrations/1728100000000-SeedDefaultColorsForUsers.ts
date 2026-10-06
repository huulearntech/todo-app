import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDefaultColorsForUsers1728100000000 implements MigrationInterface {
  name = 'SeedDefaultColorsForUsers1728100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "colors" (
        "owner_id" uuid NOT NULL,
        "hex_code" character varying(7) NOT NULL,
        "name" character varying(100) NOT NULL,
        CONSTRAINT "PK_colors_owner_hex" PRIMARY KEY ("owner_id", "hex_code"),
        CONSTRAINT "FK_colors_owner_id" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      INSERT INTO "colors" ("owner_id", "hex_code", "name")
      SELECT id, '#E0E0E0', 'Grey' FROM "users"
      ON CONFLICT ("owner_id", "hex_code") DO NOTHING;

      INSERT INTO "colors" ("owner_id", "hex_code", "name")
      SELECT id, '#EF4444', 'Red' FROM "users"
      ON CONFLICT ("owner_id", "hex_code") DO NOTHING;

      INSERT INTO "colors" ("owner_id", "hex_code", "name")
      SELECT id, '#F59E0B', 'Amber' FROM "users"
      ON CONFLICT ("owner_id", "hex_code") DO NOTHING;

      INSERT INTO "colors" ("owner_id", "hex_code", "name")
      SELECT id, '#10B981', 'Emerald' FROM "users"
      ON CONFLICT ("owner_id", "hex_code") DO NOTHING;

      INSERT INTO "colors" ("owner_id", "hex_code", "name")
      SELECT id, '#3B82F6', 'Blue' FROM "users"
      ON CONFLICT ("owner_id", "hex_code") DO NOTHING;

      INSERT INTO "colors" ("owner_id", "hex_code", "name")
      SELECT id, '#8B5CF6', 'Purple' FROM "users"
      ON CONFLICT ("owner_id", "hex_code") DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op rollback to avoid removing user colors
  }
}
