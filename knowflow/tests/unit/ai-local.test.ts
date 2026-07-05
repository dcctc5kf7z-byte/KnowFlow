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

    it('truncates title at 50 characters', () => {
      const result = processCard1(sampleText);
      expect(result.title.length).toBeLessThanOrEqual(53); // 50 + '...'
    });

    it('does not add ellipsis for short text', () => {
      const result = processCard1('Short text');
      expect(result.title).toBe('Short text');
      expect(result.title).not.toContain('...');
    });

    it('adds ellipsis for long text', () => {
      const longText = 'A'.repeat(100);
      const result = processCard1(longText);
      expect(result.title).toBe('A'.repeat(50) + '...');
    });

    it('extracts up to 3 tags', () => {
      const result = processCard1(sampleText);
      expect(result.tags.length).toBeLessThanOrEqual(3);
      expect(result.tags.length).toBeGreaterThan(0);
    });
  });

  describe('processCard2', () => {
    const validCategories = [
      'Technology', 'Science', 'Philosophy', 'Business', 'Health',
      'Education', 'Entertainment', 'Politics', 'Sports', 'Other',
    ];

    it('returns a valid category', () => {
      // Run multiple times to account for randomness
      const categories = new Set<string>();
      for (let i = 0; i < 50; i++) {
        categories.add(processCard2(sampleText).category);
      }
      // All returned categories should be valid
      categories.forEach(cat => expect(validCategories).toContain(cat));
      // Should have returned more than 1 distinct category (randomness works)
      expect(categories.size).toBeGreaterThan(1);
    });

    it('extracts keywords from input text', () => {
      const result = processCard2(sampleText);
      expect(result.keywords.length).toBeGreaterThan(0);
      expect(result.keywords.length).toBeLessThanOrEqual(5);
      // Keywords should come from the actual input
      expect(result.keywords.some(kw => sampleText.toLowerCase().includes(kw))).toBe(true);
    });

    it('generates a summary from input text', () => {
      const result = processCard2(sampleText);
      expect(result.summary.length).toBeGreaterThan(0);
      // Summary should contain parts of the original text
      expect(sampleText).toContain(result.summary.split('.')[0]);
    });
  });

  describe('processCard3', () => {
    it('returns exactly 3 angles', () => {
      const result = processCard3(sampleText);
      expect(result.angles).toHaveLength(3);
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
  });

  describe('processCard4', () => {
    it('extracts golden quotes from text', () => {
      const result = processCard4(sampleText);
      expect(result.goldenQuotes.length).toBeGreaterThan(0);
      expect(result.goldenQuotes.length).toBeLessThanOrEqual(2);
    });

    it('each quote has id and text', () => {
      const result = processCard4(sampleText);
      result.goldenQuotes.forEach(q => {
        expect(q.id).toBeDefined();
        expect(q.text.length).toBeGreaterThan(0);
      });
    });

    it('filters out short sentences', () => {
      const text = 'Hi. This is a longer sentence that should be extracted as a quote.';
      const result = processCard4(text);
      // 'Hi' is too short, should be filtered
      expect(result.goldenQuotes.every(q => q.text !== 'Hi')).toBe(true);
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
      expect(result.angles).toHaveLength(3);
      // Card 4
      expect(result.goldenQuotes).toBeDefined();
    });
  });
});
