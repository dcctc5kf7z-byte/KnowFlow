import { Conflict } from '@/types/conflict';

export function resolveConflict(
  local: Record<string, unknown>,
  remote: Record<string, unknown>
): { resolved: Record<string, unknown>; strategy: 'last-write-wins' | 'user' } {
  // Default: last-write-wins
  const localTime = local.updatedAt as string;
  const remoteTime = remote.updatedAt as string;

  if (localTime > remoteTime) {
    return { resolved: local, strategy: 'last-write-wins' };
  }

  return { resolved: remote, strategy: 'last-write-wins' };
}

export function createConflictRecord(
  entityType: 'entry' | 'node' | 'link',
  entityId: string,
  local: Record<string, unknown>,
  remote: Record<string, unknown>
): Omit<Conflict, 'id'> {
  return {
    entityType,
    entityId,
    localVersion: local,
    remoteVersion: remote,
    resolvedBy: 'last-write-wins',
    resolvedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}
