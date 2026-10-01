import { ValueTransformer } from 'typeorm';
import { type RRule, parseRRuleString, formatRRuleString } from '@todo/shared';


export class RecurrenceTransformer implements ValueTransformer {
  to(value: RRule | null): string | null {
    if (!value) {
      return null;
    }

    return formatRRuleString(value);
  }

  from(value: string | null): RRule | null {
    if (!value) {
      return null;
    }

    return parseRRuleString(value);
  }
};
