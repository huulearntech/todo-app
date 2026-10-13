import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTasksTimeRangeGistIndex1728300000000 implements MigrationInterface {
  name = 'CreateTasksTimeRangeGistIndex1728300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS tasks_time_range_gist_idx
      ON tasks USING gist (time_range);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS tasks_time_range_gist_idx;
    `);
  }
}
