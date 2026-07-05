export interface Conflict {
  id: string;
  entityType: 'entry' | 'node' | 'link';
  entityId: string;
  localVersion: Record<string, unknown>;
  remoteVersion: Record<string, unknown>;
  resolvedBy: 'last-write-wins' | 'user';
  resolvedAt: string;
  createdAt: string;
}
