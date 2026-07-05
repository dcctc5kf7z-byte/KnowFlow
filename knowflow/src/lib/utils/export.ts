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
    markdown += `**Tags:** ${entry.tags.join(', ')}\n`;
    markdown += `**Created:** ${entry.createdAt}\n\n`;
    markdown += `### Raw Text\n\n${entry.rawText}\n\n`;
    if (entry.summary) {
      markdown += `### Summary\n\n${entry.summary}\n\n`;
    }
    if (entry.goldenQuotes.length > 0) {
      markdown += `### Golden Quotes\n\n`;
      entry.goldenQuotes.forEach(quote => {
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
