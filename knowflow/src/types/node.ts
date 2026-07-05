import { SyncStatus } from './entry';

export type NodeType = 'keyword' | 'concept' | 'person' | 'tool' | 'other';

export interface Node {
  id: string;
  userId: string;
  type: NodeType;
  label: string;
  description?: string;
  entryIds: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  syncStatus: SyncStatus;
}
