import { DataSource } from 'typeorm';

jest.mock('@nestjs/common', () => ({
  Injectable: () => () => {},
  Logger: class {
    log() {}
    warn() {}
    error() {}
  },
}));

import { TrigramIndexService } from './trigram-index.service';
import { TrigramIndex } from '../decorators/trigram-index.decorator';

describe('TrigramIndexService', () => {
  let service: TrigramIndexService;
  let dataSourceMock: Partial<DataSource>;
  let queryMock: jest.Mock;

  class TestArticle {
    @TrigramIndex()
    headline: string;

    @TrigramIndex({ type: 'gist', where: 'active = true' })
    summary: string;

    body: string;
  }

  const mockEntityMetadatas: any[] = [
    {
      name: 'TestArticle',
      tableName: 'test_articles',
      target: TestArticle,
      columns: [
        { propertyName: 'headline', databaseName: 'headline_col' },
        { propertyName: 'summary', databaseName: 'summary_col' },
        { propertyName: 'body', databaseName: 'body_col' },
      ],
    },
  ];

  beforeEach(() => {
    queryMock = jest.fn();

    dataSourceMock = {
      options: { type: 'postgres' } as any,
      entityMetadatas: mockEntityMetadatas,
      query: queryMock,
    };

    service = new TrigramIndexService(dataSourceMock as DataSource);
  });

  describe('discoverDesiredIndexes', () => {
    it('should map entities and decorated properties to desired index definitions', () => {
      const desired = service.discoverDesiredIndexes();

      expect(desired).toHaveLength(2);
      expect(desired).toEqual([
        {
          tableName: 'test_articles',
          columnName: 'headline_col',
          indexName: 'idx_test_articles_headline_col_trgm',
          indexType: 'gin',
          where: undefined,
          entityName: 'TestArticle',
        },
        {
          tableName: 'test_articles',
          columnName: 'summary_col',
          indexName: 'idx_test_articles_summary_col_trgm',
          indexType: 'gist',
          where: 'active = true',
          entityName: 'TestArticle',
        },
      ]);
    });
  });

  describe('synchronizeTrigramIndexes', () => {
    it('should skip synchronization if database is not postgres', async () => {
      (dataSourceMock as any).options.type = 'mysql';
      await service.synchronizeTrigramIndexes();
      expect(queryMock).not.toHaveBeenCalled();
    });

    it('should skip synchronization if advisory lock is not acquired', async () => {
      queryMock.mockResolvedValueOnce([{ acquired: false }]);

      await service.synchronizeTrigramIndexes();

      expect(queryMock).toHaveBeenCalledTimes(1);
      expect(queryMock).toHaveBeenCalledWith(
        'SELECT pg_try_advisory_lock($1) AS acquired;',
        [TrigramIndexService.ADVISORY_LOCK_ID],
      );
    });

    it('should create missing indexes and drop orphaned ones when lock is acquired', async () => {
      // 1. Lock acquired
      queryMock.mockResolvedValueOnce([{ acquired: true }]);
      // 2. CREATE EXTENSION
      queryMock.mockResolvedValueOnce([]);
      // 3. Existing indexes query returns:
      // - headline_col already exists
      // - an old orphaned index exists (idx_test_articles_old_col_trgm)
      queryMock.mockResolvedValueOnce([
        {
          tablename: 'test_articles',
          indexname: 'idx_test_articles_headline_col_trgm',
          indexdef: 'CREATE INDEX ... USING gin (headline_col gin_trgm_ops)',
        },
        {
          tablename: 'test_articles',
          indexname: 'idx_test_articles_old_col_trgm',
          indexdef: 'CREATE INDEX ... USING gin (old_col gin_trgm_ops)',
        },
      ]);
      // 4. CREATE INDEX for summary_col
      queryMock.mockResolvedValueOnce([]);
      // 5. DROP INDEX for old_col
      queryMock.mockResolvedValueOnce([]);
      // 6. Release lock
      queryMock.mockResolvedValueOnce([]);

      await service.synchronizeTrigramIndexes();

      // Check extension query
      expect(queryMock).toHaveBeenCalledWith(
        'CREATE EXTENSION IF NOT EXISTS pg_trgm;',
      );

      // Check create index query for summary_col (missing)
      const createIndexCall = queryMock.mock.calls.find(
        (args) =>
          typeof args[0] === 'string' &&
          args[0].includes('CREATE INDEX IF NOT EXISTS "idx_test_articles_summary_col_trgm"'),
      );
      expect(createIndexCall).toBeDefined();
      expect(createIndexCall[0]).toContain(
        'USING gist ("summary_col" gist_trgm_ops) WHERE active = true',
      );

      // Check drop index query for old_col (orphaned)
      const dropIndexCall = queryMock.mock.calls.find(
        (args) =>
          typeof args[0] === 'string' &&
          args[0].includes('DROP INDEX IF EXISTS "idx_test_articles_old_col_trgm"'),
      );
      expect(dropIndexCall).toBeDefined();

      // Check lock released
      expect(queryMock).toHaveBeenCalledWith(
        'SELECT pg_advisory_unlock($1);',
        [TrigramIndexService.ADVISORY_LOCK_ID],
      );
    });
  });
});
