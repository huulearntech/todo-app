import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectCollaboration1729300000000 implements MigrationInterface {
  name = 'AddProjectCollaboration1729300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Enums
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_role_enum') THEN
          CREATE TYPE "project_role_enum" AS ENUM ('owner', 'admin', 'editor', 'viewer');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_invitation_status_enum') THEN
          CREATE TYPE "project_invitation_status_enum" AS ENUM ('pending', 'accepted', 'revoked', 'expired');
        END IF;
      END $$;
    `);

    // 2. project_members table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "project_members" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "role" "project_role_enum" NOT NULL DEFAULT 'viewer',
        "created_at" timestamptz(3) NOT NULL DEFAULT now(),
        "updated_at" timestamptz(3) NOT NULL DEFAULT now(),
        CONSTRAINT "fk_project_members_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_project_members_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "uq_project_members_project_user" UNIQUE ("project_id", "user_id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_project_members_user_id" ON "project_members" ("user_id");
      CREATE INDEX IF NOT EXISTS "idx_project_members_project_role" ON "project_members" ("project_id", "role");
    `);

    // 3. project_invitations table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "project_invitations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL,
        "invited_email" varchar(255) NOT NULL,
        "role" "project_role_enum" NOT NULL DEFAULT 'viewer',
        "status" "project_invitation_status_enum" NOT NULL DEFAULT 'pending',
        "token_hash" varchar(64) NOT NULL,
        "expires_at" timestamptz(3) NOT NULL,
        "invited_by_id" uuid NOT NULL,
        "created_at" timestamptz(3) NOT NULL DEFAULT now(),
        "updated_at" timestamptz(3) NOT NULL DEFAULT now(),
        CONSTRAINT "fk_project_invitations_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_project_invitations_user" FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_project_invitations_project_status" ON "project_invitations" ("project_id", "status");
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_project_invitations_token_hash" ON "project_invitations" ("token_hash");
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_project_invitations_pending_email" ON "project_invitations" ("project_id", lower("invited_email")) WHERE "status" = 'pending';
    `);

    // 4. Backfill existing project owners as owner members
    await queryRunner.query(`
      INSERT INTO "project_members" ("id", "project_id", "user_id", "role", "created_at", "updated_at")
      SELECT gen_random_uuid(), p."id", p."owner_id", 'owner'::"project_role_enum", now(), now()
      FROM "projects" p
      ON CONFLICT ("project_id", "user_id") DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "project_invitations";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "project_members";`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "project_invitation_status_enum";`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "project_role_enum";`);
  }
}
