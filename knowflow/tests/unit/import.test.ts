import { importFromJSON } from '@/lib/utils/import';
import { db } from '@/lib/db/dexie';
import { Entry } from '@/types/entry';
import { Node } from '@/types/node';
import { Link } from '@/types/link';

function makeEntry(id: string): Entry {
  return {
    id,
    rawText: `Text for ${id}`,
    title: `Title ${id}`,
    language: 'en',
    tags: [],
    cardStatus: { card1: 'completed', card2: 'pending', card3: 'pending', card4: 'pending' },
    scenario: 'quick_capture',
    processingMode: 'local',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: 'local',
  };
}

function makeNode(id: string): Node {
  return {
    id,
    userId: '',
    type: 'keyword',
    label: `Node ${id}`,
    entryIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: 'local',
  };
}

function makeLink(id: string): Link {
  return {
    id,
    userId: '',
    sourceNodeId: 'n1',
    targetNodeId: 'n2',
    relationship: 'related',
    weight: 3,
    source: 'ai',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: 'local',
  };
}

describe('importFromJSON', () => {
  beforeEach(async () => {
    await db.entries.clear();
    await db.nodes.clear();
    await db.links.clear();
  });

  it('imports entries from valid JSON', async () => {
    const data = {
      version: '1.0.0',
      entries: [makeEntry('e1'), makeEntry('e2')],
      nodes: [],
      links: [],
    };

    const result = await importFromJSON(JSON.stringify(data));

    expect(result.imported).toBe(2);
    expect(result.errors).toHaveLength(0);

    const entries = await db.entries.toArray();
    expect(entries).toHaveLength(2);
  });

  it('imports nodes and links', async () => {
    const data = {
      version: '1.0.0',
      entries: [],
      nodes: [makeNode('n1'), makeNode('n2')],
      links: [makeLink('l1')],
    };

    const result = await importFromJSON(JSON.stringify(data));

    expect(result.imported).toBe(0); // only entries count toward imported
    expect(result.errors).toHaveLength(0);

    const nodes = await db.nodes.toArray();
    expect(nodes).toHaveLength(2);

    const links = await db.links.toArray();
    expect(links).toHaveLength(1);
  });

  it('returns error for missing entries array', async () => {
    const data = { version: '1.0.0', nodes: [], links: [] };

    const result = await importFromJSON(JSON.stringify(data));

    expect(result.imported).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('missing entries array');
  });

  it('returns error for malformed JSON', async () => {
    const result = await importFromJSON('not valid json{{{');

    expect(result.imported).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('Failed to parse JSON');
  });

  it('skips duplicate entries (same id)', async () => {
    // Pre-populate with e1
    await db.entries.add(makeEntry('e1'));

    const data = {
      version: '1.0.0',
      entries: [makeEntry('e1'), makeEntry('e2')],
      nodes: [],
      links: [],
    };

    const result = await importFromJSON(JSON.stringify(data));

    expect(result.imported).toBe(1); // only e2 is new
    const entries = await db.entries.toArray();
    expect(entries).toHaveLength(2); // e1 already existed, e2 added
  });

  it('skips duplicate nodes', async () => {
    // Pre-populate with n1
    await db.nodes.add(makeNode('n1'));

    const data = {
      version: '1.0.0',
      entries: [],
      nodes: [makeNode('n1'), makeNode('n2')],
      links: [],
    };

    await importFromJSON(JSON.stringify(data));

    const nodes = await db.nodes.toArray();
    expect(nodes).toHaveLength(2); // n1 existed, n2 added (not duplicated)
  });

  it('handles empty entries array', async () => {
    const data = { version: '1.0.0', entries: [], nodes: [], links: [] };

    const result = await importFromJSON(JSON.stringify(data));

    expect(result.imported).toBe(0);
    expect(result.errors).toHaveLength(0);
  });
});
