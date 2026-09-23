import { ValueTransformer } from 'typeorm';

export interface TstzRange {
  start: string; // ISO 8601 String
  end: string;   // ISO 8601 String
}

export class TstzRangeTransformer implements ValueTransformer {
  // 1. Khi lưu từ code NestJS (Dạng Object với ISO string) xuống Postgres
  to(value: TstzRange | null | undefined): string | null {
    if (!value || !value.start || !value.end) return null;
    
    // Trả về chuỗi định dạng Postgres Range: [start, end)
    // [ nghĩa là bao gồm start (inclusive), ) nghĩa là không bao gồm end (exclusive)
    return `[${value.start},${value.end})`;
  }

  // 2. Khi đọc chuỗi thô từ Postgres lên code NestJS
  from(value: string | null | undefined): TstzRange | null {
    if (!value) return null;

    // Regex bóc tách các chuỗi timestamp nằm giữa dấu ngoặc [ ) hoặc ( )
    // Ví dụ chuỗi từ DB: "[2026-09-23 08:30:00+00,2026-09-23 10:30:00+00)"
    const matches = value.match(/[\[\(](.*),(.*)[\)\]]/);
    
    if (!matches || matches.length < 3) return null;

    const rawStart = matches[1].trim();
    const rawEnd = matches[2].trim();

    // Chuẩn hóa khoảng trắng của Postgres thành định dạng ISO 'T' chuẩn nếu cần
    const formatToIso = (rawUtcStr: string) => {
      // Postgres chỉ trả về dạng "YYYY-MM-DD HH:mm:ss+00", chuyển dấu cách thành "T"
      // để các thư viện như Zod hoặc JS Date parse được 100% chính xác.
      let iso = rawUtcStr.replace(' ', 'T');
      if (!iso.endsWith('Z') && !iso.includes('+') && !iso.includes('-')) {
        iso += 'Z';
      }
      return new Date(iso).toISOString(); 
    };

    return {
      start: formatToIso(rawStart),
      end: formatToIso(rawEnd),
    };
  }
}
