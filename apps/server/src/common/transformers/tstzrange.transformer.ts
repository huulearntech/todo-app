import { ValueTransformer } from 'typeorm';

export interface TstzRange {
  start: string;
  end: string;
}

export class TstzRangeTransformer implements ValueTransformer {
  // 1. Khi lưu từ code NestJS xuống Postgres
  to(value: TstzRange | null): string | null {
    if (!value) return null;
    const startStr = new Date(value.start).toISOString();
    const endStr = new Date(value.end).toISOString();
    
    // Lưu xuống DB dưới dạng dải [start, end)
    return `[${startStr},${endStr})`;
  }

  // 2. Khi đọc từ Postgres lên code NestJS
  from(value: string | null): TstzRange | null {
    if (!value) return null;

    const [start, end] = value.replace(/[\[\]\(\)]/g, '').split(',').map((dateStr) => new Date(dateStr).toISOString());
    return { start, end };
  }
}