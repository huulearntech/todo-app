import { TstzRangeTransformer } from './tstzrange.transformer';

describe('TstzRangeTransformer', () => {
  const transformer = new TstzRangeTransformer();

  describe('to (serialization)', () => {
    it('returns null when value is null or undefined', () => {
      expect(transformer.to(null)).toBeNull();
      expect(transformer.to(undefined as any)).toBeNull();
    });

    it('serializes valid TstzRange to Postgres range string [start,end)', () => {
      const start = '2026-10-15T10:00:00.000Z';
      const end = '2026-10-15T12:00:00.000Z';
      const result = transformer.to({ start, end });
      expect(result).toBe(`[${start},${end})`);
    });

    it('offsets end by 1 hour if start >= end to avoid degenerate empty range', () => {
      const start = '2026-10-15T10:00:00.000Z';
      const end = '2026-10-15T09:00:00.000Z';
      const expectedEnd = '2026-10-15T11:00:00.000Z';
      const result = transformer.to({ start, end });
      expect(result).toBe(`[${start},${expectedEnd})`);
    });
  });

  describe('from (deserialization)', () => {
    it('returns null for null, empty or empty-range string', () => {
      expect(transformer.from(null)).toBeNull();
      expect(transformer.from('')).toBeNull();
      expect(transformer.from('empty')).toBeNull();
    });

    it('deserializes Postgres range string to TstzRange object', () => {
      const start = '2026-10-15T10:00:00.000Z';
      const end = '2026-10-15T12:00:00.000Z';
      const pgRange = `[${start},${end})`;
      const result = transformer.from(pgRange);

      expect(result).toEqual({
        start,
        end,
      });
    });

    it('returns null for malformed or unparseable date range strings', () => {
      expect(transformer.from('[invalid,range)')).toBeNull();
      expect(transformer.from('[2026-10-15T10:00:00Z)')).toBeNull();
    });
  });
});
