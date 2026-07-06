import { db } from '@/lib/db/dexie';

export async function exportAsJSON(): Promise<string> {
  const entries = await db.entries.toArray();
  const nodes = await db.nodes.toArray();
  const links = await db.links.toArray();

  const data = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    entries,
    nodes,
    links,
  };

  return JSON.stringify(data, null, 2);
}

export async function exportAsMarkdown(): Promise<string> {
  const entries = await db.entries.toArray();

  let markdown = '# KnowFlow Export\n\n';
  markdown += `Exported at: ${new Date().toISOString()}\n\n`;

  entries.forEach(entry => {
    markdown += `## ${entry.title}\n\n`;
    markdown += `**Category:** ${entry.category}\n`;
    markdown += `**Tags:** ${(entry.tags || []).join(', ')}\n`;
    markdown += `**Created:** ${entry.createdAt}\n\n`;
    markdown += `### Raw Text\n\n${entry.rawText}\n\n`;
    if (entry.summary) {
      markdown += `### Summary\n\n${entry.summary}\n\n`;
    }
    const quotes = entry.goldenQuotes || [];
    if (quotes.length > 0) {
      markdown += `### Golden Quotes\n\n`;
      quotes.forEach(quote => {
        markdown += `> ${quote.text}\n\n`;
      });
    }
    markdown += '---\n\n';
  });

  return markdown;
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Alias for settings page */
export const exportAllData = exportAsJSON;

/** Import data from JSON export */
export async function importData(jsonText: string): Promise<{ entries: number; nodes: number }> {
  const data = JSON.parse(jsonText);

  if (!data.entries || !Array.isArray(data.entries)) {
    throw new Error('Invalid export format');
  }

  let importedEntries = 0;
  let importedNodes = 0;

  // Import entries (skip duplicates by id)
  for (const entry of data.entries) {
    const existing = await db.entries.get(entry.id);
    if (!existing) {
      await db.entries.add(entry);
      importedEntries++;
    }
  }

  // Import nodes (skip duplicates by id)
  if (data.nodes && Array.isArray(data.nodes)) {
    for (const node of data.nodes) {
      const existing = await db.nodes.get(node.id);
      if (!existing) {
        await db.nodes.add(node);
        importedNodes++;
      }
    }
  }

  return { entries: importedEntries, nodes: importedNodes };
}
