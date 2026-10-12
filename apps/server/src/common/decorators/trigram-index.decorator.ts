import 'reflect-metadata';

export interface TrigramIndexOptions {
  /**
   * Custom index name.
   * Default convention: `idx_${tableName}_${columnName}_trgm`
   */
  name?: string;
  /**
   * Index access method: 'gin' (default) or 'gist'.
   */
  type?: 'gin' | 'gist';
  /**
   * Optional partial index filter condition (e.g., 'completed_at IS NULL').
   */
  where?: string;
}

export const TRIGRAM_INDEX_METADATA_KEY = Symbol('TRIGRAM_INDEX_METADATA');

export interface TrigramIndexMetadataItem {
  propertyName: string;
  options?: TrigramIndexOptions;
}

/**
 * Decorator to mark an entity text/varchar property for automatic PostgreSQL trigram indexing.
 * Supports GIN (default) and GiST operator classes (`gin_trgm_ops`, `gist_trgm_ops`),
 * accelerating `%` similarity queries and `ILIKE` substring search for both English and non-English (UTF-8) text.
 */
export function TrigramIndex(options?: TrigramIndexOptions): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const propertyName = propertyKey.toString();
    const constructor = target.constructor;
    const existing: TrigramIndexMetadataItem[] =
      Reflect.getOwnMetadata(TRIGRAM_INDEX_METADATA_KEY, constructor) ?? [];

    if (!existing.some((item) => item.propertyName === propertyName)) {
      existing.push({ propertyName, options });
    }

    Reflect.defineMetadata(TRIGRAM_INDEX_METADATA_KEY, existing, constructor);
  };
}

/**
 * Retrieves all properties on an entity (walking through prototype inheritance) that are marked with @TrigramIndex().
 */
export function getTrigramIndexMetadata(
  target: Function,
): TrigramIndexMetadataItem[] {
  const results: TrigramIndexMetadataItem[] = [];
  let current: any = target;

  while (current && current !== Object && current.prototype) {
    const meta: TrigramIndexMetadataItem[] =
      Reflect.getOwnMetadata(TRIGRAM_INDEX_METADATA_KEY, current) ?? [];
    for (const item of meta) {
      if (!results.some((r) => r.propertyName === item.propertyName)) {
        results.push(item);
      }
    }
    current = Object.getPrototypeOf(current);
  }

  return results;
}
