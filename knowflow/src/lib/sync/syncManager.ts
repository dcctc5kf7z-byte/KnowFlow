import { db } from '@/lib/db/dexie';
import { getSupabase } from '@/lib/db/supabase';
import { resolveConflict } from './conflictResolver';

export async function syncAll(): Promise<{
  synced: number;
  conflicts: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let synced = 0;
  let conflicts = 0;
  const supabase = getSupabase();

  try {
    // Get items pending sync
    const pendingEntries = await db.entries.where('syncStatus').equals('pending').toArray();
    const pendingNodes = await db.nodes.where('syncStatus').equals('pending').toArray();
    const pendingLinks = await db.links.where('syncStatus').equals('pending').toArray();

    // Sync entries
    for (const entry of pendingEntries) {
      try {
        const { data: remote, error } = await supabase
          .from('entries')
          .select('*')
          .eq('id', entry.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (remote) {
          // Conflict exists - resolve
          const { resolved } = resolveConflict(entry as unknown as Record<string, unknown>, remote as unknown as Record<string, unknown>);
          await supabase.from('entries').upsert(resolved);
          conflicts++;
        } else {
          // No conflict - just insert
          await supabase.from('entries').upsert(entry);
        }

        await db.entries.update(entry.id, { syncStatus: 'synced' });
        synced++;
      } catch (error) {
        errors.push(`Failed to sync entry ${entry.id}: ${error}`);
      }
    }

    // Sync nodes
    for (const node of pendingNodes) {
      try {
        await supabase.from('nodes').upsert(node);
        await db.nodes.update(node.id, { syncStatus: 'synced' });
        synced++;
      } catch (error) {
        errors.push(`Failed to sync node ${node.id}: ${error}`);
      }
    }

    // Sync links
    for (const link of pendingLinks) {
      try {
        await supabase.from('links').upsert(link);
        await db.links.update(link.id, { syncStatus: 'synced' });
        synced++;
      } catch (error) {
        errors.push(`Failed to sync link ${link.id}: ${error}`);
      }
    }
  } catch (error) {
    errors.push(`Sync failed: ${error}`);
  }

  return { synced, conflicts, errors };
}

export function startSyncListener() {
  // Sync when coming online
  window.addEventListener('online', async () => {
    console.log('Online - starting sync...');
    const result = await syncAll();
    console.log('Sync result:', result);
  });

  // Periodic sync every 5 minutes
  setInterval(async () => {
    if (navigator.onLine) {
      await syncAll();
    }
  }, 5 * 60 * 1000);
}
