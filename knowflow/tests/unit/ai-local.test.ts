import { processCard1, processCard2, processCard3, processCard4, processLocally } from '@/lib/ai/local';

describe('AI Local Processing', () => {
  const sampleText = 'Artificial intelligence is transforming healthcare. Machine learning algorithms can detect diseases earlier than traditional methods.';

  beforeAll(() => {
    // Mock crypto.randomUUID for deterministic tests
    let counter = 0;
    jest.spyOn(crypto, 'randomUUID').mockImplementation(() => `test-uuid-${++counter}`);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('processCard1', () => {
    it('detects language', () => {
      const result = processCard1(sampleText);
      expect(result.language).toBe('en');
    });

    it('extracts title from first meaningful sentence', () => {
      const result = processCard1(sampleText);
      expect(result.title.length).toBeGreaterThan(0);
      expect(result.title.length).toBeLessThanOrEqual(63); // 60 + '...'
    });

    it('does not add ellipsis for short text', () => {
      const result = processCard1('Short text');
      expect(result.title).toBe('Short text');
      expect(result.title).not.toContain('...');
    });

    it('adds ellipsis for long text', () => {
      const longText = 'This is a very long sentence that goes on and on and should definitely be truncated at some point because it exceeds the limit.';
      const result = processCard1(longText);
      expect(result.title.length).toBeLessThanOrEqual(63);
    });

    it('extracts up to 6 tags', () => {
      const result = processCard1(sampleText);
      expect(result.tags.length).toBeLessThanOrEqual(6);
      expect(result.tags.length).toBeGreaterThan(0);
    });
  });

  describe('processCard2', () => {
    const validCategories = [
      'Technology', 'Science', 'Philosophy', 'Business', 'Health',
      'Education', 'Creative', 'Life', 'Other',
    ];

    it('returns a valid category', () => {
      const result = processCard2(sampleText);
      expect(validCategories).toContain(result.category);
    });

    it('extracts keywords from input text', () => {
      const result = processCard2(sampleText);
      expect(result.keywords.length).toBeGreaterThan(0);
      expect(result.keywords.length).toBeLessThanOrEqual(8);
    });

    it('generates a summary from input text', () => {
      const result = processCard2(sampleText);
      expect(result.summary.length).toBeGreaterThan(0);
    });

    it('detects subcategory for tech content', () => {
      const techText = 'React components use hooks for state management in frontend development.';
      const result = processCard2(techText);
      expect(result.category).toBe('Technology');
    });
  });

  describe('processCard3', () => {
    it('returns 3-5 angles', () => {
      const result = processCard3(sampleText);
      expect(result.angles.length).toBeGreaterThanOrEqual(3);
      expect(result.angles.length).toBeLessThanOrEqual(5);
    });

    it('each angle has required fields', () => {
      const result = processCard3(sampleText);
      result.angles.forEach(angle => {
        expect(angle.id).toBeDefined();
        expect(angle.text).toBeDefined();
        expect(angle.selected).toBe(false);
        expect(angle.source).toBe('local');
      });
    });

    it('angle texts are meaningful strings', () => {
      const result = processCard3(sampleText);
      result.angles.forEach(angle => {
        expect(angle.text.length).toBeGreaterThan(5);
      });
    });

    it('adds content-aware angles for problem text', () => {
      const problemText = '这个bug导致了系统错误，需要修复失败的问题。';
      const result = processCard3(problemText, 'Technology');
      expect(result.angles.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('processCard4', () => {
    it('extracts golden quotes from text', () => {
      const result = processCard4(sampleText);
      expect(result.goldenQuotes.length).toBeGreaterThan(0);
      expect(result.goldenQuotes.length).toBeLessThanOrEqual(4);
    });

    it('each quote has id and text', () => {
      const result = processCard4(sampleText);
      result.goldenQuotes.forEach(q => {
        expect(q.id).toBeDefined();
        expect(q.text.length).toBeGreaterThan(0);
      });
    });

    it('extracts quoted text', () => {
      const text = 'He said "this is an important principle that guides our work" and continued.';
      const result = processCard4(text);
      expect(result.goldenQuotes.length).toBeGreaterThan(0);
    });

    it('returns empty quotes for empty text', () => {
      const result = processCard4('');
      expect(result.goldenQuotes).toEqual([]);
    });
  });

  describe('processLocally', () => {
    it('combines all card results', () => {
      const result = processLocally(sampleText);
      // Card 1
      expect(result.language).toBeDefined();
      expect(result.title).toBeDefined();
      expect(result.tags).toBeDefined();
      // Card 2
      expect(result.category).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.keywords).toBeDefined();
      // Card 3
      expect(result.angles).toBeDefined();
      expect(result.angles.length).toBeGreaterThanOrEqual(3);
      // Card 4
      expect(result.goldenQuotes).toBeDefined();
    });
  });
});
