import { db } from '@/lib/db/dexie';

export interface SearchResult {
  type: 'entry' | 'node' | 'tag';
  id: string;
  title: string;
  subtitle?: string;
  score: number;
}

export async function search(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  const results: SearchResult[] = [];

  // Search entries (filter out soft-deleted)
  const entries = await db.entries.filter(e => !e.deletedAt).toArray();
  entries.forEach(entry => {
    let score = 0;
    if (entry.title.toLowerCase().includes(lowerQuery)) score += 10;
    if (entry.rawText.toLowerCase().includes(lowerQuery)) score += 5;
    if (entry.summary?.toLowerCase().includes(lowerQuery)) score += 3;
    if (entry.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) score += 7;

    if (score > 0) {
      results.push({
        type: 'entry',
        id: entry.id,
        title: entry.title,
        subtitle: entry.summary?.slice(0, 100),
        score,
      });
    }
  });

  // Search nodes (filter out soft-deleted)
  const nodes = await db.nodes.filter(n => !n.deletedAt).toArray();
  nodes.forEach(node => {
    let score = 0;
    if (node.label.toLowerCase().includes(lowerQuery)) score += 10;
    if (node.description?.toLowerCase().includes(lowerQuery)) score += 5;

    if (score > 0) {
      results.push({
        type: 'node',
        id: node.id,
        title: node.label,
        subtitle: node.description,
        score,
      });
    }
  });

  // Sort by score
  return results.sort((a, b) => b.score - a.score).slice(0, 20);
}
