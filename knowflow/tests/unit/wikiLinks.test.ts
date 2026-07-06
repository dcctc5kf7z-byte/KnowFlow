import {
  extractWikiLinks,
  resolveWikiLinks,
  buildBacklinks,
  wikiLinksToMarkdown,
  generateMarkdown,
} from '@/lib/utils/wikiLinks';
import { Entry } from '@/types/entry';

// Helper to create a minimal Entry
function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: 'test-id',
    rawText: 'Test content',
    title: 'Test Entry',
    language: 'en',
    cardStatus: { card1: 'completed', card2: 'completed', card3: 'completed', card4: 'completed' },
    tags: [],
    keywords: [],
    angles: [],
    goldenQuotes: [],
    extractedNodes: [],
    linkedEntryIds: [],
    processingScenario: 'deep_digest',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: 'local',
    ...overrides,
  } as Entry;
}

describe('Wiki-Links', () => {
  describe('extractWikiLinks', () => {
    it('extracts simple [[wiki-link]]', () => {
      const links = extractWikiLinks('See [[React Hooks]] for details.');
      expect(links).toHaveLength(1);
      expect(links[0].targetTitle).toBe('React Hooks');
      expect(links[0].displayText).toBe('React Hooks');
      expect(links[0].startIndex).toBe(4);
    });

    it('extracts [[link|alias]] syntax', () => {
      const links = extractWikiLinks('Check [[React Hooks|hooks]] here.');
      expect(links).toHaveLength(1);
      expect(links[0].targetTitle).toBe('React Hooks');
      expect(links[0].displayText).toBe('hooks');
    });

    it('extracts multiple links', () => {
      const links = extractWikiLinks('[[React]] and [[Vue]] are frameworks.');
      expect(links).toHaveLength(2);
      expect(links[0].targetTitle).toBe('React');
      expect(links[1].targetTitle).toBe('Vue');
    });

    it('returns empty array for no links', () => {
      expect(extractWikiLinks('No links here.')).toEqual([]);
    });

    it('handles empty string', () => {
      expect(extractWikiLinks('')).toEqual([]);
    });

    it('trims whitespace in target titles', () => {
      const links = extractWikiLinks('[[ React Hooks ]]');
      expect(links[0].targetTitle).toBe('React Hooks');
    });

    it('tracks correct start and end indices', () => {
      const text = 'Start [[Link]] end.';
      const links = extractWikiLinks(text);
      expect(links[0].startIndex).toBe(6);
      expect(links[0].endIndex).toBe(14);
      expect(text.slice(links[0].startIndex, links[0].endIndex)).toBe('[[Link]]');
    });
  });

  describe('resolveWikiLinks', () => {
    const entries = [
      makeEntry({ id: 'id-react', title: 'React Hooks' }),
      makeEntry({ id: 'id-vue', title: 'Vue Composition API' }),
      makeEntry({ id: 'id-angular', title: 'Angular' }),
    ];

    it('resolves exact title match', () => {
      const links = extractWikiLinks('[[React Hooks]]');
      const resolved = resolveWikiLinks(links, entries);
      expect(resolved[0].targetId).toBe('id-react');
    });

    it('resolves case-insensitive match', () => {
      const links = extractWikiLinks('[[react hooks]]');
      const resolved = resolveWikiLinks(links, entries);
      expect(resolved[0].targetId).toBe('id-react');
    });

    it('resolves partial match (link text contained in title)', () => {
      const links = extractWikiLinks('[[Vue]]');
      const resolved = resolveWikiLinks(links, entries);
      expect(resolved[0].targetId).toBe('id-vue');
    });

    it('returns null for unresolved link', () => {
      const links = extractWikiLinks('[[Svelte]]');
      const resolved = resolveWikiLinks(links, entries);
      expect(resolved[0].targetId).toBeNull();
    });

    it('resolves multiple links correctly', () => {
      const links = extractWikiLinks('[[React Hooks]] and [[Angular]]');
      const resolved = resolveWikiLinks(links, entries);
      expect(resolved[0].targetId).toBe('id-react');
      expect(resolved[1].targetId).toBe('id-angular');
    });
  });

  describe('buildBacklinks', () => {
    it('finds entries that link to the target', () => {
      const entries = [
        makeEntry({ id: 'id-a', title: 'Entry A', rawText: 'See [[Entry B]] for details.' }),
        makeEntry({ id: 'id-b', title: 'Entry B', rawText: 'This is B.' }),
        makeEntry({ id: 'id-c', title: 'Entry C', rawText: 'Also see [[Entry B]] here.' }),
      ];

      const backlinks = buildBacklinks('id-b', entries);
      expect(backlinks).toHaveLength(2);
      expect(backlinks.map(b => b.entryId)).toContain('id-a');
      expect(backlinks.map(b => b.entryId)).toContain('id-c');
    });

    it('does not include self-references', () => {
      const entries = [
        makeEntry({ id: 'id-a', title: 'Entry A', rawText: 'See [[Entry A]] for details.' }),
      ];

      const backlinks = buildBacklinks('id-a', entries);
      expect(backlinks).toHaveLength(0);
    });

    it('skips deleted entries', () => {
      const entries = [
        makeEntry({ id: 'id-a', title: 'Entry A', rawText: '[[Entry B]]', deletedAt: new Date().toISOString() }),
        makeEntry({ id: 'id-b', title: 'Entry B', rawText: '' }),
      ];

      const backlinks = buildBacklinks('id-b', entries);
      expect(backlinks).toHaveLength(0);
    });

    it('returns empty when no backlinks exist', () => {
      const entries = [
        makeEntry({ id: 'id-a', title: 'Entry A', rawText: 'No links.' }),
        makeEntry({ id: 'id-b', title: 'Entry B', rawText: '' }),
      ];

      expect(buildBacklinks('id-b', entries)).toEqual([]);
    });

    it('includes context snippet', () => {
      const entries = [
        makeEntry({
          id: 'id-a',
          title: 'Entry A',
          rawText: 'Before link. See [[Entry B]] for more info.',
        }),
        makeEntry({ id: 'id-b', title: 'Entry B', rawText: '' }),
      ];

      const backlinks = buildBacklinks('id-b', entries);
      expect(backlinks[0].context).toContain('[[Entry B]]');
    });
  });

  describe('wikiLinksToMarkdown', () => {
    const entries = [
      makeEntry({ id: 'id-react', title: 'React Hooks' }),
      makeEntry({ id: 'id-vue', title: 'Vue' }),
    ];

    it('converts resolved link to markdown link', () => {
      const md = wikiLinksToMarkdown('See [[React Hooks]] here.', entries);
      expect(md).toBe('See [React Hooks](/library/id-react) here.');
    });

    it('converts unresolved link to # href', () => {
      const md = wikiLinksToMarkdown('See [[Svelte]] here.', entries);
      expect(md).toBe('See [Svelte](#) here.');
    });

    it('preserves alias in display text', () => {
      const md = wikiLinksToMarkdown('See [[React Hooks|hooks]] here.', entries);
      expect(md).toBe('See [hooks](/library/id-react) here.');
    });

    it('converts multiple links', () => {
      const md = wikiLinksToMarkdown('[[React Hooks]] and [[Vue]]', entries);
      expect(md).toBe('[React Hooks](/library/id-react) and [Vue](/library/id-vue)');
    });

    it('returns original text when no links', () => {
      const text = 'No links here.';
      expect(wikiLinksToMarkdown(text, entries)).toBe(text);
    });
  });

  describe('generateMarkdown', () => {
    it('generates full markdown with title and content', () => {
      const entry = makeEntry({
        title: 'My Note',
        rawText: 'Some content with [[Other Note]].',
        category: 'Technology',
        summary: 'A tech note.',
      });

      const md = generateMarkdown(entry, []);
      expect(md).toContain('# My Note');
      expect(md).toContain('**分类:** Technology');
      expect(md).toContain('> A tech note.');
      expect(md).toContain('Some content with [[Other Note]].');
    });

    it('includes golden quotes', () => {
      const entry = makeEntry({
        goldenQuotes: [{ id: 'q1', text: 'Important quote.' }],
      });

      const md = generateMarkdown(entry, []);
      expect(md).toContain('## 精华摘录');
      expect(md).toContain('> Important quote.');
    });

    it('includes angles with checkbox state', () => {
      const entry = makeEntry({
        angles: [
          { id: 'a1', text: 'Angle one', selected: true, source: 'local' },
          { id: 'a2', text: 'Angle two', selected: false, source: 'local' },
        ],
      });

      const md = generateMarkdown(entry, []);
      expect(md).toContain('- [x] Angle one');
      expect(md).toContain('- [ ] Angle two');
    });

    it('includes keywords', () => {
      const entry = makeEntry({ keywords: ['react', 'hooks'] });
      const md = generateMarkdown(entry, []);
      expect(md).toContain('## 关键词');
      expect(md).toContain('`react`');
      expect(md).toContain('`hooks`');
    });

    it('handles missing optional fields gracefully', () => {
      const entry = makeEntry({
        title: 'Minimal',
        rawText: 'Content',
        // All optional fields undefined
      });
      // Should not throw
      const md = generateMarkdown(entry, []);
      expect(md).toContain('# Minimal');
    });
  });
});
