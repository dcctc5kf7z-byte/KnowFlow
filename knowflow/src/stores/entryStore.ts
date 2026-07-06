import { create } from 'zustand';
import { Entry } from '@/types/entry';
import { db } from '@/lib/db/dexie';

interface EntryState {
  entries: Entry[];
  currentEntry: Entry | null;
  isLoading: boolean;
  error: string | null;
  loadEntries: () => Promise<void>;
  loadEntry: (id: string) => Promise<void>;
  createEntry: (entry: Omit<Entry, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => Promise<Entry>;
  updateEntry: (id: string, updates: Partial<Entry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}

export const useEntryStore = create<EntryState>((set) => ({
  entries: [],
  currentEntry: null,
  isLoading: false,
  error: null,

  loadEntries: async () => {
    set({ isLoading: true, error: null });
    try {
      const entries = await db.entries.filter(e => !e.deletedAt).toArray();
      set({ entries, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  loadEntry: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const entry = await db.entries.get(id);
      set({ currentEntry: entry || null, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  createEntry: async (entryData) => {
    const now = new Date().toISOString();
    const entry: Entry = {
      ...entryData,
      linkedEntryIds: entryData.linkedEntryIds || [],
      markdownContent: entryData.markdownContent || '',
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      syncStatus: 'local',
    };
    await db.entries.add(entry);
    set(state => ({ entries: [...state.entries, entry] }));
    return entry;
  },

  updateEntry: async (id, updates) => {
    const now = new Date().toISOString();
    await db.entries.update(id, { ...updates, updatedAt: now, syncStatus: 'pending' });
    set(state => ({
      entries: state.entries.map(e => e.id === id ? { ...e, ...updates, updatedAt: now } : e),
      currentEntry: state.currentEntry?.id === id
        ? { ...state.currentEntry, ...updates, updatedAt: now }
        : state.currentEntry,
    }));
  },

  deleteEntry: async (id) => {
    const now = new Date().toISOString();
    await db.entries.update(id, { deletedAt: now, syncStatus: 'pending' });
    set(state => ({
      entries: state.entries.filter(e => e.id !== id),
      currentEntry: state.currentEntry?.id === id ? null : state.currentEntry,
    }));
  },
}));
