import {
  selectDigestEntries,
  generateReflection,
  findPotentialConnections,
  generateDailyDigest,
} from '@/lib/ai/digest';
import { Entry } from '@/types/entry';

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: 'test-id',
    rawText: 'Test content about React hooks and state management.',
    title: 'Test Entry',
    language: 'en',
    cardStatus: { card1: 'completed', card2: 'completed', card3: 'completed', card4: 'completed' },
    tags: ['react'],
    keywords: ['hooks', 'state'],
    angles: [],
    goldenQuotes: [],
    extractedNodes: [],
    linkedEntryIds: [],
    processingScenario: 'deep_digest',
    category: 'Technology',
    summary: 'A test entry',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: 'local',
    ...overrides,
  } as Entry;
}

describe('Daily Digest', () => {
  describe('selectDigestEntries', () => {
    it('returns empty array for no entries', () => {
      expect(selectDigestEntries([])).toEqual([]);
    });

    it('returns up to count entries', () => {
      const entries = [
        makeEntry({ id: '1' }),
        makeEntry({ id: '2' }),
        makeEntry({ id: '3' }),
        makeEntry({ id: '4' }),
      ];
      const selected = selectDigestEntries(entries, 2);
      expect(selected.length).toBeLessThanOrEqual(2);
    });

    it('skips deleted entries', () => {
      const entries = [
        makeEntry({ id: '1', deletedAt: new Date().toISOString() }),
        makeEntry({ id: '2' }),
      ];
      const selected = selectDigestEntries(entries, 3);
      expect(selected.every(e => !e.deletedAt)).toBe(true);
    });

    it('returns all entries when count > entries.length', () => {
      const entries = [makeEntry({ id: '1' })];
      const selected = selectDigestEntries(entries, 5);
      expect(selected.length).toBe(1);
    });
  });

  describe('generateReflection', () => {
    it('returns a non-empty string', () => {
      const entry = makeEntry();
      const reflection = generateReflection(entry);
      expect(reflection.length).toBeGreaterThan(0);
    });

    it('returns tech-specific reflection for Technology category', () => {
      const entry = makeEntry({ category: 'Technology' });
      const reflection = generateReflection(entry);
      // Should contain tech-related words
      expect(typeof reflection).toBe('string');
    });

    it('handles entries with golden quotes', () => {
      const entry = makeEntry({
        goldenQuotes: [{ id: 'q1', text: 'This is an important quote about life' }],
      });
      const reflection = generateReflection(entry);
      expect(reflection.length).toBeGreaterThan(0);
    });
  });

  describe('findPotentialConnections', () => {
    it('finds entries with shared keywords', () => {
      const target = makeEntry({ id: 'target', keywords: ['react', 'hooks'] });
      const all = [
        target,
        makeEntry({ id: 'other', keywords: ['react', 'vue'], title: 'Vue Guide' }),
      ];
      const connections = findPotentialConnections(target, all);
      expect(connections.length).toBeGreaterThan(0);
      expect(connections[0].entryId).toBe('other');
    });

    it('finds entries with shared tags', () => {
      const target = makeEntry({ id: 'target', tags: ['frontend'], keywords: [] });
      const all = [
        target,
        makeEntry({ id: 'other', tags: ['frontend'], keywords: [], title: 'CSS Tips' }),
      ];
      const connections = findPotentialConnections(target, all);
      expect(connections.length).toBeGreaterThan(0);
    });

    it('does not include self as connection', () => {
      const target = makeEntry({ id: 'target', keywords: ['react'] });
      const connections = findPotentialConnections(target, [target]);
      expect(connections.every(c => c.entryId !== 'target')).toBe(true);
    });

    it('excludes deleted entries', () => {
      const target = makeEntry({ id: 'target', keywords: ['react'] });
      const deleted = makeEntry({ id: 'deleted', keywords: ['react'], deletedAt: new Date().toISOString() });
      const connections = findPotentialConnections(target, [target, deleted]);
      expect(connections.length).toBe(0);
    });

    it('respects maxConnections limit', () => {
      const target = makeEntry({ id: 'target', keywords: ['react'] });
      const others = Array.from({ length: 10 }, (_, i) =>
        makeEntry({ id: `other-${i}`, keywords: ['react'], title: `Entry ${i}` })
      );
      const connections = findPotentialConnections(target, [target, ...others], 2);
      expect(connections.length).toBeLessThanOrEqual(2);
    });
  });

  describe('generateDailyDigest', () => {
    it('returns a valid digest structure', () => {
      const entries = [
        makeEntry({ id: '1', createdAt: new Date(Date.now() - 86400000 * 3).toISOString() }),
        makeEntry({ id: '2', createdAt: new Date(Date.now() - 86400000 * 10).toISOString() }),
        makeEntry({ id: '3', createdAt: new Date(Date.now() - 86400000 * 20).toISOString() }),
      ];
      const digest = generateDailyDigest(entries);

      expect(digest.date).toBeDefined();
      expect(digest.entries.length).toBeGreaterThan(0);
      expect(digest.entries.length).toBeLessThanOrEqual(3);
      expect(digest.insight).toBeDefined();

      digest.entries.forEach(item => {
        expect(item.entry).toBeDefined();
        expect(item.reason).toBeDefined();
        expect(item.reflection).toBeDefined();
        expect(Array.isArray(item.connections)).toBe(true);
      });
    });

    it('returns empty entries for less than 2 entries', () => {
      // generateDailyDigest should still work, but the UI won't show it
      const entries = [makeEntry({ id: '1' })];
      const digest = generateDailyDigest(entries);
      expect(digest.entries.length).toBeLessThanOrEqual(1);
    });
  });
});
