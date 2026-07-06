import { search } from '@/lib/utils/search';
import { db } from '@/lib/db/dexie';
import { Entry } from '@/types/entry';
import { Node } from '@/types/node';

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: 'e1',
    userId: '',
    rawText: 'Test raw text',
    title: 'Test Title',
    language: 'en',
    tags: ['test'],
    category: '',
    summary: '',
    keywords: [],
    angles: [],
    goldenQuotes: [],
    extractedNodes: [],
    linkedEntryIds: [],
    markdownContent: '',
    cardStatus: { card1: 'completed', card2: 'pending', card3: 'pending', card4: 'pending' },
    scenario: 'quick_capture',
    processingMode: 'local',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: 'local',
    ...overrides,
  };
}

function makeNode(overrides: Partial<Node> = {}): Node {
  return {
    id: 'n1',
    userId: '',
    type: 'keyword',
    label: 'Test Node',
    entryIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: 'local',
    ...overrides,
  };
}

describe('search', () => {
  beforeEach(async () => {
    await db.entries.clear();
    await db.nodes.clear();
  });

  it('returns empty array for empty query', async () => {
    expect(await search('')).toEqual([]);
    expect(await search('   ')).toEqual([]);
  });

  it('finds entries by title', async () => {
    await db.entries.add(makeEntry({ id: 'e1', title: 'Machine Learning Basics' }));

    const results = await search('machine');

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].type).toBe('entry');
    expect(results[0].title).toBe('Machine Learning Basics');
  });

  it('finds entries by rawText', async () => {
    await db.entries.add(makeEntry({ id: 'e1', title: 'No Match', rawText: 'Deep learning is powerful' }));

    const results = await search('deep');

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('e1');
  });

  it('finds entries by tags', async () => {
    await db.entries.add(makeEntry({ id: 'e1', title: 'X', tags: ['artificial-intelligence'] }));

    const results = await search('artificial');

    expect(results.length).toBeGreaterThan(0);
  });

  it('finds nodes by label', async () => {
    await db.nodes.add(makeNode({ id: 'n1', label: 'Neural Network' }));

    const results = await search('neural');

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].type).toBe('node');
    expect(results[0].title).toBe('Neural Network');
  });

  it('scores title matches higher than rawText', async () => {
    await db.entries.add(makeEntry({ id: 'e1', title: 'Python Guide', rawText: 'no match here' }));
    await db.entries.add(makeEntry({ id: 'e2', title: 'Something Else', rawText: 'python is great' }));

    const results = await search('python');

    expect(results.length).toBe(2);
    // Title match (10) > rawText match (5)
    expect(results[0].id).toBe('e1');
  });

  it('scores tag matches (7) higher than rawText (5)', async () => {
    await db.entries.add(makeEntry({ id: 'e1', title: 'X', rawText: 'python stuff', tags: [] }));
    await db.entries.add(makeEntry({ id: 'e2', title: 'Y', rawText: 'nope', tags: ['python'] }));

    const results = await search('python');

    expect(results[0].id).toBe('e2'); // tag match wins
  });

  it('sorts results by score descending', async () => {
    await db.entries.add(makeEntry({ id: 'e1', title: 'AI', rawText: 'ai', tags: ['ai'] }));
    await db.entries.add(makeEntry({ id: 'e2', title: 'Something', rawText: 'ai is cool' }));

    const results = await search('ai');

    expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
  });

  it('caps results at 20', async () => {
    for (let i = 0; i < 25; i++) {
      await db.entries.add(makeEntry({ id: `e${i}`, title: `Match ${i} keyword` }));
    }

    const results = await search('keyword');

    expect(results.length).toBeLessThanOrEqual(20);
  });

  it('excludes soft-deleted entries', async () => {
    await db.entries.add(makeEntry({ id: 'e1', title: 'Alive Match' }));
    await db.entries.add(makeEntry({ id: 'e2', title: 'Deleted Match', deletedAt: new Date().toISOString() }));

    const results = await search('match');

    expect(results.length).toBe(1);
    expect(results[0].id).toBe('e1');
  });

  it('excludes soft-deleted nodes', async () => {
    await db.nodes.add(makeNode({ id: 'n1', label: 'Alive Node' }));
    await db.nodes.add(makeNode({ id: 'n2', label: 'Deleted Node', deletedAt: new Date().toISOString() }));

    const results = await search('node');

    expect(results.length).toBe(1);
    expect(results[0].id).toBe('n1');
  });
});
