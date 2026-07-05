import { create } from 'zustand';
import { Node, NodeType } from '@/types/node';
import { db } from '@/lib/db/dexie';

interface NodeState {
  nodes: Node[];
  isLoading: boolean;
  error: string | null;
  loadNodes: () => Promise<void>;
  createNode: (type: NodeType, label: string, description?: string) => Promise<Node>;
  updateNode: (id: string, updates: Partial<Node>) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;
}

export const useNodeStore = create<NodeState>((set) => ({
  nodes: [],
  isLoading: false,
  error: null,

  loadNodes: async () => {
    set({ isLoading: true, error: null });
    try {
      const nodes = await db.nodes.filter(n => !n.deletedAt).toArray();
      set({ nodes, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  createNode: async (type, label, description) => {
    const now = new Date().toISOString();
    const node: Node = {
      id: crypto.randomUUID(),
      userId: '', // Will be set by auth
      type,
      label,
      description,
      entryIds: [],
      createdAt: now,
      updatedAt: now,
      syncStatus: 'local',
    };
    await db.nodes.add(node);
    set(state => ({ nodes: [...state.nodes, node] }));
    return node;
  },

  updateNode: async (id, updates) => {
    const now = new Date().toISOString();
    await db.nodes.update(id, { ...updates, updatedAt: now, syncStatus: 'pending' });
    set(state => ({
      nodes: state.nodes.map(n => n.id === id ? { ...n, ...updates, updatedAt: now } : n),
    }));
  },

  deleteNode: async (id) => {
    const now = new Date().toISOString();
    await db.nodes.update(id, { deletedAt: now, syncStatus: 'pending' });
    set(state => ({ nodes: state.nodes.filter(n => n.id !== id) }));
  },
}));
