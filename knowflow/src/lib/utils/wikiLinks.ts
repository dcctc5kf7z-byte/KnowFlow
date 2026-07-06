/**
 * Wiki-link utilities — bidirectional linking like Obsidian
 *
 * Syntax: [[Entry Title]] or [[Entry Title|Display Text]]
 */

import { Entry, Backlink } from '@/types/entry';

/** Regex to match [[wiki-link]] or [[wiki-link|alias]] */
const WIKI_LINK_REGEX = /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g;

export interface WikiLinkMatch {
  /** The full match string e.g. [[Note|alias]] */
  raw: string;
  /** The target entry title */
  targetTitle: string;
  /** Display text (alias) or target title if no alias */
  displayText: string;
  /** Start index in the source text */
  startIndex: number;
  /** End index in the source text */
  endIndex: number;
}

/**
 * Extract all [[wiki-links]] from text
 */
export function extractWikiLinks(text: string): WikiLinkMatch[] {
  const matches: WikiLinkMatch[] = [];
  let match: RegExpExecArray | null;

  // Reset regex state
  WIKI_LINK_REGEX.lastIndex = 0;

  while ((match = WIKI_LINK_REGEX.exec(text)) !== null) {
    matches.push({
      raw: match[0],
      targetTitle: match[1].trim(),
      displayText: match[2]?.trim() || match[1].trim(),
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return matches;
}

/**
 * Resolve wiki-link targets to actual entry IDs
 */
export function resolveWikiLinks(
  links: WikiLinkMatch[],
  entries: Entry[]
): Array<WikiLinkMatch & { targetId: string | null }> {
  return links.map(link => {
    // Exact title match (case-insensitive)
    const exact = entries.find(
      e => e.title.toLowerCase() === link.targetTitle.toLowerCase()
    );
    if (exact) return { ...link, targetId: exact.id };

    // Partial match — title contains the link target
    const partial = entries.find(
      e => e.title.toLowerCase().includes(link.targetTitle.toLowerCase())
    );
    if (partial) return { ...link, targetId: partial.id };

    return { ...link, targetId: null };
  });
}

/**
 * Build backlinks for a given entry from all other entries
 */
export function buildBacklinks(
  entryId: string,
  entries: Entry[]
): Backlink[] {
  const backlinks: Backlink[] = [];

  for (const other of entries) {
    if (other.id === entryId) continue;
    if (other.deletedAt) continue;

    const text = other.rawText || other.summary || '';
    const links = extractWikiLinks(text);

    for (const link of links) {
      // Check if this link targets our entry
      if (link.targetTitle.toLowerCase() === other.title.toLowerCase()) continue;

      // Find target entry
      const target = entries.find(
        e => e.title.toLowerCase() === link.targetTitle.toLowerCase()
      );

      if (target && target.id === entryId) {
        // Extract context: sentence containing the link
        const contextStart = Math.max(0, text.lastIndexOf('。', link.startIndex) + 1);
        const contextEnd = text.indexOf('。', link.endIndex);
        const context = text.slice(
          contextStart,
          contextEnd > 0 ? contextEnd : link.endIndex + 50
        ).trim();

        backlinks.push({
          entryId: other.id,
          entryTitle: other.title,
          context: context.length > 150 ? context.slice(0, 147) + '...' : context,
          offset: link.startIndex,
        });
      }
    }
  }

  return backlinks;
}

/**
 * Convert text with [[wiki-links]] to markdown links
 */
export function wikiLinksToMarkdown(text: string, entries: Entry[]): string {
  return text.replace(WIKI_LINK_REGEX, (raw, title, alias) => {
    const display = alias || title;
    const entry = entries.find(
      e => e.title.toLowerCase() === title.trim().toLowerCase()
    );
    if (entry) {
      return `[${display}](/library/?id=${entry.id})`;
    }
    return `[${display}](#)`; // Unresolved link
  });
}

/**
 * Generate markdown content for an entry
 */
export function generateMarkdown(entry: Entry, entries: Entry[]): string {
  const lines: string[] = [];

  // Title
  lines.push(`# ${entry.title}`);
  lines.push('');

  // Metadata
  const meta: string[] = [];
  if (entry.category) meta.push(`**分类:** ${entry.category}`);
  if (entry.subCategory) meta.push(`**子分类:** ${entry.subCategory}`);
  if (entry.tags.length > 0) meta.push(`**标签:** ${entry.tags.map(t => `\`${t}\``).join(' ')}`);
  if (meta.length > 0) {
    lines.push(meta.join(' · '));
    lines.push('');
  }

  // Summary
  if (entry.summary) {
    lines.push(`> ${entry.summary}`);
    lines.push('');
  }

  // Raw content with wiki-links preserved
  lines.push('## 内容');
  lines.push('');
  lines.push(entry.rawText);
  lines.push('');

  // Golden quotes
  const quotes = entry.goldenQuotes || [];
  if (quotes.length > 0) {
    lines.push('## 精华摘录');
    lines.push('');
    quotes.forEach(q => {
      lines.push(`> ${q.text}`);
      lines.push('');
    });
  }

  // Angles
  const angles = entry.angles || [];
  if (angles.length > 0) {
    lines.push('## 思考角度');
    lines.push('');
    angles.forEach(a => {
      const checkbox = a.selected ? '[x]' : '[ ]';
      lines.push(`- ${checkbox} ${a.text}`);
    });
    lines.push('');
  }

  // Keywords
  const keywords = entry.keywords || [];
  if (keywords.length > 0) {
    lines.push('## 关键词');
    lines.push('');
    lines.push(keywords.map(k => `\`${k}\``).join(' '));
    lines.push('');
  }

  return lines.join('\n');
}
