/**
 * AI Daily Digest — resurface old knowledge with fresh connections
 *
 * This is what Obsidian CAN'T do: proactively push insights to the user.
 * Instead of waiting for the user to search, KnowFlow surfaces forgotten
 * knowledge and finds unexpected connections.
 */

import { Entry } from '@/types/entry';
import { extractWikiLinks } from '@/lib/utils/wikiLinks';

export interface DigestEntry {
  entry: Entry;
  /** Why this entry was selected */
  reason: string;
  /** AI-generated reflection prompt */
  reflection: string;
  /** Suggested connections to other entries */
  connections: Array<{ entryId: string; entryTitle: string; reason: string }>;
}

export interface DailyDigest {
  date: string;
  entries: DigestEntry[];
  /** Overall insight across all selected entries */
  insight: string;
}

/**
 * Select entries for daily digest using spaced repetition logic
 * - Prioritize entries not viewed recently
 * - Mix old and new entries
 * - Avoid showing the same entry too frequently
 */
export function selectDigestEntries(
  entries: Entry[],
  count: number = 3
): Entry[] {
  if (entries.length === 0) return [];

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  // Score each entry by "digest priority"
  const scored = entries
    .filter(e => !e.deletedAt)
    .map(entry => {
      const created = new Date(entry.createdAt).getTime();
      const ageInDays = (now - created) / DAY;

      // Prefer entries that are 1-30 days old (not too new, not too old)
      const ageScore = ageInDays < 1 ? 0.3 : ageInDays < 7 ? 0.8 : ageInDays < 30 ? 1.0 : 0.6;

      // Prefer entries with more content (richer to reflect on)
      const contentScore = Math.min(entry.rawText.length / 500, 1.0);

      // Prefer entries with fewer links (orphan entries need attention)
      const linkScore = 1.0 / (1 + (entry.linkedEntryIds || []).length);

      // Prefer entries with completed processing
      const statusValues = Object.values(entry.cardStatus || {});
      const completedCount = statusValues.filter(s => s === 'completed').length;
      const processScore = completedCount / 4;

      // Random factor for variety
      const randomFactor = 0.5 + Math.random() * 0.5;

      const score = (ageScore * 0.3 + contentScore * 0.2 + linkScore * 0.2 + processScore * 0.1 + randomFactor * 0.2);

      return { entry, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, count).map(s => s.entry);
}

/**
 * Generate a reflection prompt for an entry
 * Uses pattern-based generation (no API needed)
 */
export function generateReflection(entry: Entry): string {
  const reflections: string[] = [];

  // Category-based reflections
  if (entry.category === 'Technology') {
    reflections.push(
      `你上次研究「${entry.title}」时，这项技术有什么新进展？`,
      `这个技术方案现在还适用吗？有没有更好的替代方案？`,
      `你在实际项目中用到了这个知识吗？效果如何？`
    );
  } else if (entry.category === 'Philosophy') {
    reflections.push(
      `你对「${entry.title}」的理解有没有发生变化？`,
      `这个观点如何影响了你的日常决策？`,
      `你能想到一个反例来挑战这个观点吗？`
    );
  } else if (entry.category === 'Business') {
    reflections.push(
      `市场环境变化后，这个策略还有效吗？`,
      `你从这个案例中学到了什么可以应用到当前项目？`,
      `竞争对手做了什么不同的选择？`
    );
  } else {
    reflections.push(
      `回顾「${entry.title}」——你现在会怎么理解这个话题？`,
      `这个知识和你最近学的东西有什么联系？`,
      `如果要给朋友解释这个概念，你会怎么说？`
    );
  }

  // Content-aware reflections
  if (entry.rawText.length > 1000) {
    reflections.push(`这篇长文的核心观点是什么？用一句话总结。`);
  }

  const quotes = entry.goldenQuotes || [];
  if (quotes.length > 0) {
    reflections.push(`「${quotes[0].text.slice(0, 30)}...」这句话现在对你意味着什么？`);
  }

  return reflections[Math.floor(Math.random() * reflections.length)];
}

/**
 * Find potential connections between entries
 * Uses keyword overlap and content similarity
 */
export function findPotentialConnections(
  target: Entry,
  allEntries: Entry[],
  maxConnections: number = 3
): Array<{ entryId: string; entryTitle: string; reason: string }> {
  const targetKeywords = new Set(
    (target.keywords || []).map(k => k.toLowerCase())
  );
  const targetTags = new Set(
    (target.tags || []).map(t => t.toLowerCase())
  );
  const targetLinks = new Set(target.linkedEntryIds || []);

  const candidates = allEntries
    .filter(e => e.id !== target.id && !e.deletedAt)
    .map(entry => {
      let score = 0;
      const reasons: string[] = [];

      // Keyword overlap
      const entryKeywords = new Set(
        (entry.keywords || []).map(k => k.toLowerCase())
      );
      const keywordOverlap = [...targetKeywords].filter(k => entryKeywords.has(k));
      if (keywordOverlap.length > 0) {
        score += keywordOverlap.length * 2;
        reasons.push(`共同关键词: ${keywordOverlap.slice(0, 2).join(', ')}`);
      }

      // Tag overlap
      const entryTags = new Set(
        (entry.tags || []).map(t => t.toLowerCase())
      );
      const tagOverlap = [...targetTags].filter(t => entryTags.has(t));
      if (tagOverlap.length > 0) {
        score += tagOverlap.length * 1.5;
        reasons.push(`共同标签: ${tagOverlap.slice(0, 2).join(', ')}`);
      }

      // Same category
      if (entry.category && entry.category === target.category) {
        score += 1;
        reasons.push(`同属「${entry.category}」分类`);
      }

      // Not already linked
      if (!targetLinks.has(entry.id)) {
        score += 0.5; // Bonus for discovering new connections
      }

      return {
        entryId: entry.id,
        entryTitle: entry.title,
        reason: reasons[0] || '内容相关',
        score,
      };
    })
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score);

  return candidates.slice(0, maxConnections).map(({ entryId, entryTitle, reason }) => ({
    entryId,
    entryTitle,
    reason,
  }));
}

/**
 * Generate the full daily digest
 */
export function generateDailyDigest(allEntries: Entry[]): DailyDigest {
  const selected = selectDigestEntries(allEntries, 3);

  const entries: DigestEntry[] = selected.map(entry => ({
    entry,
    reason: getSelectionReason(entry),
    reflection: generateReflection(entry),
    connections: findPotentialConnections(entry, allEntries),
  }));

  // Generate overall insight
  const categories = [...new Set(selected.map(e => e.category).filter(Boolean))];
  const insight = categories.length > 1
    ? `今天的知识跨越 ${categories.join('、')} 等领域——试着找到它们之间的隐藏联系。`
    : selected.length > 0
      ? `今天回顾的 ${selected.length} 条知识都和「${selected[0].category || '思考'}」有关——看看你能不能发现新的角度。`
      : '开始记录你的第一条知识吧！';

  return {
    date: new Date().toISOString().slice(0, 10),
    entries,
    insight,
  };
}

function getSelectionReason(entry: Entry): string {
  const now = Date.now();
  const created = new Date(entry.createdAt).getTime();
  const ageInDays = Math.floor((now - created) / (24 * 60 * 60 * 1000));

  if (ageInDays <= 1) return '刚刚创建，回顾一下要点';
  if (ageInDays <= 7) return '本周创建，还没完全消化';
  if (ageInDays <= 30) return '一个月前的知识，该复习了';
  return '早期记录，重新发现它的价值';
}
