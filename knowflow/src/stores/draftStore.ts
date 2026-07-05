import { create } from 'zustand';
import { Draft } from '@/types/draft';
import { db } from '@/lib/db/dexie';

interface DraftState {
  drafts: Draft[];
  currentDraft: Draft | null;
  isLoading: boolean;
  loadDrafts: () => Promise<void>;
  saveDraft: (rawText: string, sourceType: Draft['sourceType'], sourceUrl?: string) => Promise<Draft>;
  updateDraft: (id: string, updates: Partial<Draft>) => Promise<void>;
  deleteDraft: (id: string) => Promise<void>;
  convertToEntry: (id: string, entryId: string) => Promise<void>;
}

export const useDraftStore = create<DraftState>((set) => ({
  drafts: [],
  currentDraft: null,
  isLoading: false,

  loadDrafts: async () => {
    set({ isLoading: true });
    try {
      const now = new Date().toISOString();
      const drafts = await db.drafts
        .where('expiresAt')
        .above(now)
        .and(d => !d.convertedToEntryId)
        .toArray();
      set({ drafts, isLoading: false });
    } catch (error) {
      console.error('Failed to load drafts:', error);
      set({ isLoading: false });
    }
  },

  saveDraft: async (rawText, sourceType, sourceUrl) => {
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const draft: Draft = {
      id: crypto.randomUUID(),
      rawText,
      sourceType,
      sourceUrl,
      createdAt: now,
      expiresAt,
    };
    await db.drafts.add(draft);
    set(state => ({ drafts: [...state.drafts, draft], currentDraft: draft }));
    return draft;
  },

  updateDraft: async (id, updates) => {
    await db.drafts.update(id, updates);
    set(state => ({
      drafts: state.drafts.map(d => d.id === id ? { ...d, ...updates } : d),
      currentDraft: state.currentDraft?.id === id
        ? { ...state.currentDraft, ...updates }
        : state.currentDraft,
    }));
  },

  deleteDraft: async (id) => {
    await db.drafts.delete(id);
    set(state => ({
      drafts: state.drafts.filter(d => d.id !== id),
      currentDraft: state.currentDraft?.id === id ? null : state.currentDraft,
    }));
  },

  convertToEntry: async (id, entryId) => {
    await db.drafts.update(id, { convertedToEntryId: entryId });
    set(state => ({
      drafts: state.drafts.filter(d => d.id !== id),
      currentDraft: null,
    }));
  },
}));
