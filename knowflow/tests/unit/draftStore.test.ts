import { useDraftStore } from '@/stores/draftStore';
import { db } from '@/lib/db/dexie';
import { Draft } from '@/types/draft';

function makeDraft(overrides: Partial<Draft> = {}): Draft {
  return {
    id: 'draft-1',
    rawText: 'Draft text',
    sourceType: 'manual',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

describe('draftStore', () => {
  beforeEach(async () => {
    await db.drafts.clear();
    useDraftStore.setState({ drafts: [], currentDraft: null, isLoading: false });
  });

  describe('saveDraft', () => {
    it('creates a draft with 30-day expiry', async () => {
      const before = Date.now();
      const draft = await useDraftStore.getState().saveDraft('Hello', 'manual');
      const after = Date.now();

      const expiresAt = new Date(draft.expiresAt).getTime();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;

      expect(expiresAt).toBeGreaterThanOrEqual(before + thirtyDays);
      expect(expiresAt).toBeLessThanOrEqual(after + thirtyDays);
    });

    it('sets draft as currentDraft', async () => {
      const draft = await useDraftStore.getState().saveDraft('Test', 'manual');

      expect(useDraftStore.getState().currentDraft).toBeDefined();
      expect(useDraftStore.getState().currentDraft!.id).toBe(draft.id);
    });

    it('adds draft to drafts array', async () => {
      await useDraftStore.getState().saveDraft('Test', 'manual');

      expect(useDraftStore.getState().drafts).toHaveLength(1);
    });

    it('persists to Dexie', async () => {
      const draft = await useDraftStore.getState().saveDraft('Persisted', 'url', 'https://example.com');

      const fromDb = await db.drafts.get(draft.id);
      expect(fromDb).toBeDefined();
      expect(fromDb!.rawText).toBe('Persisted');
      expect(fromDb!.sourceUrl).toBe('https://example.com');
    });
  });

  describe('loadDrafts', () => {
    it('loads non-expired, non-converted drafts', async () => {
      const futureDate = new Date(Date.now() + 1000000).toISOString();
      await db.drafts.add(makeDraft({ id: 'd1', expiresAt: futureDate }));
      await db.drafts.add(makeDraft({ id: 'd2', expiresAt: futureDate }));

      await useDraftStore.getState().loadDrafts();

      expect(useDraftStore.getState().drafts).toHaveLength(2);
    });

    it('filters out expired drafts', async () => {
      const pastDate = new Date(Date.now() - 1000).toISOString();
      const futureDate = new Date(Date.now() + 1000000).toISOString();
      await db.drafts.add(makeDraft({ id: 'd1', expiresAt: pastDate }));
      await db.drafts.add(makeDraft({ id: 'd2', expiresAt: futureDate }));

      await useDraftStore.getState().loadDrafts();

      expect(useDraftStore.getState().drafts).toHaveLength(1);
      expect(useDraftStore.getState().drafts[0].id).toBe('d2');
    });

    it('filters out converted drafts', async () => {
      const futureDate = new Date(Date.now() + 1000000).toISOString();
      await db.drafts.add(makeDraft({ id: 'd1', expiresAt: futureDate }));
      await db.drafts.add(makeDraft({ id: 'd2', expiresAt: futureDate, convertedToEntryId: 'entry-1' }));

      await useDraftStore.getState().loadDrafts();

      expect(useDraftStore.getState().drafts).toHaveLength(1);
      expect(useDraftStore.getState().drafts[0].id).toBe('d1');
    });
  });

  describe('deleteDraft', () => {
    it('hard-deletes draft from db', async () => {
      await db.drafts.add(makeDraft({ id: 'd1' }));
      await useDraftStore.setState({ drafts: [makeDraft({ id: 'd1' })] });

      await useDraftStore.getState().deleteDraft('d1');

      const fromDb = await db.drafts.get('d1');
      expect(fromDb).toBeUndefined();
    });

    it('removes draft from state', async () => {
      await db.drafts.add(makeDraft({ id: 'd1' }));
      useDraftStore.setState({ drafts: [makeDraft({ id: 'd1' })], currentDraft: makeDraft({ id: 'd1' }) });

      await useDraftStore.getState().deleteDraft('d1');

      expect(useDraftStore.getState().drafts).toHaveLength(0);
      expect(useDraftStore.getState().currentDraft).toBeNull();
    });
  });

  describe('convertToEntry', () => {
    it('sets convertedToEntryId on draft', async () => {
      await db.drafts.add(makeDraft({ id: 'd1' }));
      useDraftStore.setState({ drafts: [makeDraft({ id: 'd1' })] });

      await useDraftStore.getState().convertToEntry('d1', 'entry-1');

      const fromDb = await db.drafts.get('d1');
      expect(fromDb!.convertedToEntryId).toBe('entry-1');
    });

    it('removes draft from visible list', async () => {
      await db.drafts.add(makeDraft({ id: 'd1' }));
      useDraftStore.setState({ drafts: [makeDraft({ id: 'd1' })], currentDraft: makeDraft({ id: 'd1' }) });

      await useDraftStore.getState().convertToEntry('d1', 'entry-1');

      expect(useDraftStore.getState().drafts).toHaveLength(0);
      expect(useDraftStore.getState().currentDraft).toBeNull();
    });
  });
});
