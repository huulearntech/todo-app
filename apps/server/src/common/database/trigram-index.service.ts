import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  getTrigramIndexMetadata,
  TrigramIndexOptions,
} from '../decorators/trigram-index.decorator';

export interface DesiredTrigramIndex {
  tableName: string;
  columnName: string;
  indexName: string;
  indexType: 'gin' | 'gist';
  where?: string;
  entityName: string;
}

export interface ExistingManagedIndex {
  tablename: string;
  indexname: string;
  indexdef: string;
}

@Injectable()
export class TrigramIndexService implements OnApplicationBootstrap {
  private readonly logger = new Logger(TrigramIndexService.name);
  public static readonly ADVISORY_LOCK_ID = 84930219;

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.synchronizeTrigramIndexes();
  }

  async synchronizeTrigramIndexes(): Promise<void> {
    if (this.dataSource.options.type !== 'postgres') {
      return;
    }

    // Acquire PostgreSQL advisory lock to ensure safe synchronization in multi-instance setups
    const lockRows = await this.dataSource.query(
      `SELECT pg_try_advisory_lock($1) AS acquired;`,
      [TrigramIndexService.ADVISORY_LOCK_ID],
    );
    const acquired = lockRows[0]?.acquired === true;
    if (!acquired) {
      this.logger.log(
        'Another instance is currently synchronizing trigram indexes. Skipping.',
      );
      return;
    }

    try {
      // 1. Ensure pg_trgm extension is installed
      await this.dataSource.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

      // 2. Discover desired indexes declared via @TrigramIndex()
      const desiredIndexes = this.discoverDesiredIndexes();

      // 3. Discover existing trigram indexes from PostgreSQL pg_indexes
      const existingIndexes = await this.discoverExistingIndexes();

      // 4. Create missing indexes
      for (const desired of desiredIndexes) {
        const exists = existingIndexes.some(
          (e) => e.indexname.toLowerCase() === desired.indexName.toLowerCase(),
        );

        if (!exists) {
          const ops = `${desired.indexType}_trgm_ops`;
          const whereClause = desired.where ? ` WHERE ${desired.where}` : '';
          const sql = `
            CREATE INDEX IF NOT EXISTS "${desired.indexName}"
            ON "${desired.tableName}"
            USING ${desired.indexType} ("${desired.columnName}" ${ops})${whereClause};
          `;
          await this.dataSource.query(sql);
          this.logger.log(
            `Created trigram index "${desired.indexName}" on "${desired.tableName}"("${desired.columnName}")`,
          );
        }
      }

      // 5. Clean up orphaned managed indexes (indexes following our convention that are no longer declared)
      for (const existing of existingIndexes) {
        const isDesired = desiredIndexes.some(
          (d) => d.indexName.toLowerCase() === existing.indexname.toLowerCase(),
        );

        if (!isDesired) {
          await this.dataSource.query(
            `DROP INDEX IF EXISTS "${existing.indexname}";`,
          );
          this.logger.warn(
            `Dropped orphaned trigram index "${existing.indexname}" on "${existing.tablename}"`,
          );
        }
      }
    } catch (error) {
      this.logger.error('Failed to synchronize trigram indexes', error);
      throw error;
    } finally {
      await this.dataSource.query(`SELECT pg_advisory_unlock($1);`, [
        TrigramIndexService.ADVISORY_LOCK_ID,
      ]);
    }
  }

  public discoverDesiredIndexes(): DesiredTrigramIndex[] {
    const list: DesiredTrigramIndex[] = [];

    for (const metadata of this.dataSource.entityMetadatas) {
      if (!metadata.target || typeof metadata.target !== 'function') {
        continue;
      }

      const items = getTrigramIndexMetadata(metadata.target);

      for (const item of items) {
        const col = metadata.columns.find(
          (c) => c.propertyName === item.propertyName,
        );

        if (!col) {
          this.logger.warn(
            `@TrigramIndex: Property "${item.propertyName}" on entity "${metadata.name}" is not a mapped column.`,
          );
          continue;
        }

        const indexType = item.options?.type ?? 'gin';
        const indexName =
          item.options?.name ??
          `idx_${metadata.tableName}_${col.databaseName}_trgm`;

        list.push({
          tableName: metadata.tableName,
          columnName: col.databaseName,
          indexName,
          indexType,
          where: item.options?.where,
          entityName: metadata.name,
        });
      }
    }

    return list;
  }

  public async discoverExistingIndexes(): Promise<ExistingManagedIndex[]> {
    const rows: { tablename: string; indexname: string; indexdef: string }[] =
      await this.dataSource.query(`
        SELECT tablename, indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = current_schema()
          AND (indexname LIKE 'idx_%_trgm' OR indexname LIKE 'IDX_%_trgm');
      `);

    // Ensure we only treat indexes with trigram ops as managed trigram indexes
    return rows.filter((row) =>
      row.indexdef.toLowerCase().includes('_trgm_ops'),
    );
  }
}
