import { useEntryStore } from '@/stores/entryStore';
import { db } from '@/lib/db/dexie';
import { Entry } from '@/types/entry';

// Helper to create a minimal Entry for testing
function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: 'test-id-1',
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

describe('entryStore', () => {
  beforeEach(async () => {
    await db.entries.clear();
    useEntryStore.setState({ entries: [], currentEntry: null, isLoading: false, error: null });
  });

  describe('createEntry', () => {
    it('creates an entry with generated id and timestamps', async () => {
      const entryData = {
        userId: '',
        rawText: 'Hello world',
        title: '',
        language: 'en',
        tags: [],
        category: '',
        summary: '',
        keywords: [],
        angles: [],
        goldenQuotes: [],
        extractedNodes: [],
        linkedEntryIds: [],
        markdownContent: '',
        cardStatus: { card1: 'pending' as const, card2: 'pending' as const, card3: 'pending' as const, card4: 'pending' as const },
        scenario: 'quick_capture' as const,
        processingMode: 'local' as const,
      };

      const created = await useEntryStore.getState().createEntry(entryData);

      expect(created.id).toBeDefined();
      expect(created.id).not.toBe('');
      expect(created.createdAt).toBeDefined();
      expect(created.updatedAt).toBeDefined();
      expect(created.syncStatus).toBe('local');
      expect(created.rawText).toBe('Hello world');
    });

    it('adds entry to state', async () => {
      const entryData = {
        userId: '',
        rawText: 'Test',
        title: '',
        language: 'en',
        tags: [],
        category: '',
        summary: '',
        keywords: [],
        angles: [],
        goldenQuotes: [],
        extractedNodes: [],
        linkedEntryIds: [],
        markdownContent: '',
        cardStatus: { card1: 'pending' as const, card2: 'pending' as const, card3: 'pending' as const, card4: 'pending' as const },
        scenario: 'quick_capture' as const,
        processingMode: 'local' as const,
      };

      await useEntryStore.getState().createEntry(entryData);

      expect(useEntryStore.getState().entries).toHaveLength(1);
      expect(useEntryStore.getState().entries[0].rawText).toBe('Test');
    });

    it('persists entry to Dexie', async () => {
      const entryData = {
        userId: '',
        rawText: 'Persisted',
        title: '',
        language: 'en',
        tags: [],
        category: '',
        summary: '',
        keywords: [],
        angles: [],
        goldenQuotes: [],
        extractedNodes: [],
        linkedEntryIds: [],
        markdownContent: '',
        cardStatus: { card1: 'pending' as const, card2: 'pending' as const, card3: 'pending' as const, card4: 'pending' as const },
        scenario: 'quick_capture' as const,
        processingMode: 'local' as const,
      };

      const created = await useEntryStore.getState().createEntry(entryData);
      const fromDb = await db.entries.get(created.id);

      expect(fromDb).toBeDefined();
      expect(fromDb!.rawText).toBe('Persisted');
    });
  });

  describe('loadEntries', () => {
    it('loads non-deleted entries', async () => {
      await db.entries.add(makeEntry({ id: 'e1', title: 'Entry 1' }));
      await db.entries.add(makeEntry({ id: 'e2', title: 'Entry 2' }));

      await useEntryStore.getState().loadEntries();

      expect(useEntryStore.getState().entries).toHaveLength(2);
    });

    it('filters out soft-deleted entries', async () => {
      await db.entries.add(makeEntry({ id: 'e1', title: 'Alive' }));
      await db.entries.add(makeEntry({ id: 'e2', title: 'Deleted', deletedAt: new Date().toISOString() }));

      await useEntryStore.getState().loadEntries();

      expect(useEntryStore.getState().entries).toHaveLength(1);
      expect(useEntryStore.getState().entries[0].title).toBe('Alive');
    });

    it('sets isLoading during load', async () => {
      await db.entries.add(makeEntry({ id: 'e1' }));

      const promise = useEntryStore.getState().loadEntries();
      // isLoading should be true immediately after calling
      expect(useEntryStore.getState().isLoading).toBe(true);

      await promise;
      expect(useEntryStore.getState().isLoading).toBe(false);
    });
  });

  describe('loadEntry', () => {
    it('loads a single entry by id', async () => {
      await db.entries.add(makeEntry({ id: 'e1', title: 'Single Entry' }));

      await useEntryStore.getState().loadEntry('e1');

      expect(useEntryStore.getState().currentEntry).toBeDefined();
      expect(useEntryStore.getState().currentEntry!.title).toBe('Single Entry');
    });

    it('sets currentEntry to null when not found', async () => {
      await useEntryStore.getState().loadEntry('nonexistent');

      expect(useEntryStore.getState().currentEntry).toBeNull();
    });
  });

  describe('updateEntry', () => {
    it('updates entry in state and db', async () => {
      await db.entries.add(makeEntry({ id: 'e1', title: 'Original' }));
      await useEntryStore.getState().loadEntries();

      await useEntryStore.getState().updateEntry('e1', { title: 'Updated' });

      expect(useEntryStore.getState().entries[0].title).toBe('Updated');

      const fromDb = await db.entries.get('e1');
      expect(fromDb!.title).toBe('Updated');
    });

    it('sets syncStatus to pending on update', async () => {
      await db.entries.add(makeEntry({ id: 'e1', syncStatus: 'synced' }));
      await useEntryStore.getState().loadEntries();

      await useEntryStore.getState().updateEntry('e1', { title: 'Changed' });

      const fromDb = await db.entries.get('e1');
      expect(fromDb!.syncStatus).toBe('pending');
    });
  });

  describe('deleteEntry', () => {
    it('soft-deletes entry (sets deletedAt)', async () => {
      await db.entries.add(makeEntry({ id: 'e1' }));
      await useEntryStore.getState().loadEntries();

      await useEntryStore.getState().deleteEntry('e1');

      expect(useEntryStore.getState().entries).toHaveLength(0);

      const fromDb = await db.entries.get('e1');
      expect(fromDb!.deletedAt).toBeDefined();
    });

    it('sets syncStatus to pending on delete', async () => {
      await db.entries.add(makeEntry({ id: 'e1', syncStatus: 'synced' }));

      await useEntryStore.getState().deleteEntry('e1');

      const fromDb = await db.entries.get('e1');
      expect(fromDb!.syncStatus).toBe('pending');
    });
  });
});
