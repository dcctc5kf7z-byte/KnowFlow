import { db } from '@/lib/db/dexie';
import { Entry } from '@/types/entry';
import { Node } from '@/types/node';
import { Link } from '@/types/link';

interface ImportData {
  version: string;
  entries: Entry[];
  nodes: Node[];
  links: Link[];
}

export async function importFromJSON(jsonString: string): Promise<{ imported: number; errors: string[] }> {
  const errors: string[] = [];
  let imported = 0;

  try {
    const data: ImportData = JSON.parse(jsonString);

    if (!data.entries || !Array.isArray(data.entries)) {
      errors.push('Invalid format: missing entries array');
      return { imported, errors };
    }

    // Import entries
    for (const entry of data.entries) {
      try {
        const existing = await db.entries.get(entry.id);
        if (!existing) {
          await db.entries.add(entry);
          imported++;
        }
      } catch (error) {
        errors.push(`Failed to import entry ${entry.id}: ${error}`);
      }
    }

    // Import nodes
    if (data.nodes) {
      for (const node of data.nodes) {
        try {
          const existing = await db.nodes.get(node.id);
          if (!existing) {
            await db.nodes.add(node);
          }
        } catch (error) {
          errors.push(`Failed to import node ${node.id}: ${error}`);
        }
      }
    }

    // Import links
    if (data.links) {
      for (const link of data.links) {
        try {
          const existing = await db.links.get(link.id);
          if (!existing) {
            await db.links.add(link);
          }
        } catch (error) {
          errors.push(`Failed to import link ${link.id}: ${error}`);
        }
      }
    }
  } catch (error) {
    errors.push(`Failed to parse JSON: ${error}`);
  }

  return { imported, errors };
}
