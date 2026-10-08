import { ValueTransformer } from 'typeorm';

export interface TstzRange {
  start: string;
  end: string;
}

export class TstzRangeTransformer implements ValueTransformer {
  // 1. Khi lưu từ code NestJS xuống Postgres
  to(value: TstzRange | null): string | null {
    if (!value) return null;
    const startDate = new Date(value.start);
    let endDate = new Date(value.end);

    // If start equals or exceeds end, offset end to avoid degenerate [x, x) empty range in Postgres
    if (startDate.getTime() >= endDate.getTime()) {
      endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    }

    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();

    // Lưu xuống DB dưới dạng dải [start, end)
    return `[${startStr},${endStr})`;
  }

  // 2. Khi đọc từ Postgres lên code NestJS
  from(value: string | null): TstzRange | null {
    if (!value || value === 'empty') return null;

    try {
      const clean = value.replace(/[\[\]\(\)]/g, '').trim();
      if (!clean || clean === 'empty') return null;

      const parts = clean.split(',');
      if (parts.length < 2) return null;

      const startDate = new Date(parts[0]);
      const endDate = new Date(parts[1]);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return null;
      }

      return {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      };
    } catch {
      return null;
    }
  }
}
