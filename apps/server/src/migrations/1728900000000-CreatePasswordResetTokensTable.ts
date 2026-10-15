import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePasswordResetTokensTable1728900000000
  implements MigrationInterface
{
  name = 'CreatePasswordResetTokensTable1728900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
        "token_hash" character varying(64) NOT NULL,
        "user_id" uuid NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "is_used" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_password_reset_tokens_token_hash" PRIMARY KEY ("token_hash"),
        CONSTRAINT "FK_password_reset_tokens_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_password_reset_tokens_user_id" ON "password_reset_tokens" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_password_reset_tokens_user_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_tokens"`);
  }
}
