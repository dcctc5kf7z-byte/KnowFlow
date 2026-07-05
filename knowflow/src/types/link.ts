import { SyncStatus } from './entry';

export interface Link {
  id: string;
  userId: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationship: string;
  weight: number;
  source: 'ai' | 'user';
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}
