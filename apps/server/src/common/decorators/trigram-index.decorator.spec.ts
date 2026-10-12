import {
  TrigramIndex,
  getTrigramIndexMetadata,
} from './trigram-index.decorator';

describe('TrigramIndex Decorator', () => {
  it('should attach metadata to an entity class for decorated properties', () => {
    class SampleEntity {
      @TrigramIndex()
      title: string;

      @TrigramIndex({ type: 'gist', name: 'idx_custom_content_trgm' })
      content: string;

      unindexed: string;
    }

    const metadata = getTrigramIndexMetadata(SampleEntity);

    expect(metadata).toHaveLength(2);
    expect(metadata).toEqual(
      expect.arrayContaining([
        { propertyName: 'title', options: undefined },
        {
          propertyName: 'content',
          options: { type: 'gist', name: 'idx_custom_content_trgm' },
        },
      ]),
    );
  });

  it('should support inheritance prototype chain', () => {
    class BaseEntity {
      @TrigramIndex()
      baseField: string;
    }

    class ChildEntity extends BaseEntity {
      @TrigramIndex()
      childField: string;
    }

    const metadata = getTrigramIndexMetadata(ChildEntity);

    expect(metadata).toHaveLength(2);
    expect(metadata.map((m) => m.propertyName)).toEqual(
      expect.arrayContaining(['baseField', 'childField']),
    );
  });

  it('should avoid duplicate entries if decorator is called multiple times on same property', () => {
    class DuplicateEntity {
      @TrigramIndex()
      title: string;
    }

    // Explicitly call decorator again on same property
    TrigramIndex()(DuplicateEntity.prototype, 'title');

    const metadata = getTrigramIndexMetadata(DuplicateEntity);
    expect(metadata).toHaveLength(1);
  });
});
