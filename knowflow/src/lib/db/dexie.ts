import Dexie, { Table } from 'dexie';
import { Entry } from '@/types/entry';
import { Node } from '@/types/node';
import { Link } from '@/types/link';
import { Draft } from '@/types/draft';
import { UserSettings } from '@/types/settings';

export interface SyncQueueItem {
  id?: number;
  entityType: 'entry' | 'node' | 'link';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  timestamp: string;
}

class KnowFlowDB extends Dexie {
  entries!: Table<Entry>;
  nodes!: Table<Node>;
  links!: Table<Link>;
  drafts!: Table<Draft>;
  userSettings!: Table<UserSettings>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('KnowFlowDB');
    this.version(1).stores({
      entries: 'id, userId, category, createdAt, deletedAt, syncStatus',
      nodes: 'id, userId, type, label, deletedAt, syncStatus',
      links: 'id, userId, sourceNodeId, targetNodeId, syncStatus',
      drafts: 'id, userId, createdAt, expiresAt',
      userSettings: 'userId',
      syncQueue: '++id, entityType, entityId, action, timestamp',
    });
    this.version(2).stores({
      entries: 'id, userId, category, createdAt, deletedAt, syncStatus',
      nodes: 'id, userId, type, label, deletedAt, syncStatus',
      links: 'id, userId, sourceNodeId, targetNodeId, syncStatus',
      drafts: 'id, userId, createdAt, expiresAt',
      userSettings: 'userId',
      syncQueue: '++id, entityType, entityId, action, timestamp',
    }).upgrade(async (tx) => {
      // Add linkedEntryIds and markdownContent to existing entries
      await tx.table('entries').toCollection().modify(entry => {
        entry.linkedEntryIds = entry.linkedEntryIds || [];
        entry.markdownContent = entry.markdownContent || '';
      });
    });
  }
}

export const db = new KnowFlowDB();
