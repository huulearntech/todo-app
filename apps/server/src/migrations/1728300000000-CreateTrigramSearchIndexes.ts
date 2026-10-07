import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTrigramSearchIndexes1728300000000 implements MigrationInterface {
  name = 'CreateTrigramSearchIndexes1728300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_projects_name_trgm"
      ON "projects" USING gin ("name" gin_trgm_ops);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_task_labels_name_trgm"
      ON "task_labels" USING gin ("name" gin_trgm_ops);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_tasks_title_trgm"
      ON "tasks" USING gin ("title" gin_trgm_ops);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_tasks_title_trgm";`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_task_labels_name_trgm";`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_projects_name_trgm";`);
  }
}
