import { Entry, ProcessingScenario } from '@/types/entry';
import { processLocally, LocalAIResult } from './local';
import { processCardWithAPI, AIGenerateResult } from './api';
import { withFallback } from './fallback';
import { db } from '@/lib/db/dexie';
import { useNodeStore } from '@/stores/nodeStore';
import { extractWikiLinks, resolveWikiLinks, generateMarkdown } from '@/lib/utils/wikiLinks';
import { useEntryStore } from '@/stores/entryStore';

/** Extract the usable result — API wraps in AIGenerateResult, local returns LocalAIResult directly */
function unwrapResult(result: AIGenerateResult<unknown> | LocalAIResult): LocalAIResult {
  if ('success' in result && result.success && result.data) {
    return result.data.result as LocalAIResult;
  }
  return result as LocalAIResult;
}

export async function processEntry(
  entry: Entry,
  scenario: ProcessingScenario
): Promise<Partial<Entry>> {
  const updates: Partial<Entry> = {};

  // Card 1: Input & Record (always local)
  const card1Result = processLocally(entry.rawText);
  updates.language = card1Result.language;
  updates.title = card1Result.title;
  updates.tags = card1Result.tags;
  updates.cardStatus = { ...entry.cardStatus, card1: 'completed' };

  // Card 2: Categorize & Classify
  if (scenario !== 'quick_capture') {
    const { result, degraded } = await withFallback(
      () => processCardWithAPI('categorize', entry.rawText),
      () => processLocally(entry.rawText)
    );
    const data = unwrapResult(result);
    updates.category = data.category;
    updates.subCategory = data.subCategory;
    updates.summary = data.summary;
    updates.keywords = data.keywords;
    updates.cardStatus = {
      ...updates.cardStatus!,
      card2: degraded ? 'degraded' : 'completed',
    };
  }

  // Card 3: Recommended Angles
  if (scenario === 'deep_digest' || scenario === 'writing_material' || scenario === 'knowledge_link') {
    const { result, degraded } = await withFallback(
      () => processCardWithAPI('angles', entry.rawText),
      () => processLocally(entry.rawText)
    );
    const data = unwrapResult(result);
    updates.angles = data.angles;
    updates.cardStatus = {
      ...updates.cardStatus!,
      card3: degraded ? 'degraded' : 'completed',
    };
  }

  // Card 4: Extract & Connect
  if (scenario !== 'quick_capture') {
    const { result, degraded } = await withFallback(
      () => processCardWithAPI('quotes', entry.rawText),
      () => processLocally(entry.rawText)
    );
    const data = unwrapResult(result);
    updates.goldenQuotes = data.goldenQuotes;
    updates.cardStatus = {
      ...updates.cardStatus!,
      card4: degraded ? 'degraded' : 'completed',
    };

    // Create nodes from keywords
    const keywords = updates.keywords || card1Result.tags;
    const nodeIds: string[] = [];
    const { createNode, nodes } = useNodeStore.getState();

    for (const keyword of keywords) {
      const existingNode = nodes.find(n => n.label.toLowerCase() === keyword.toLowerCase());
      if (existingNode) {
        nodeIds.push(existingNode.id);
        if (!existingNode.entryIds.includes(entry.id)) {
          await db.nodes.update(existingNode.id, {
            entryIds: [...existingNode.entryIds, entry.id],
          });
        }
      } else {
        const node = await createNode('keyword', keyword);
        nodeIds.push(node.id);
      }
    }

    updates.extractedNodes = nodeIds;
  }

  // ─── Bidirectional Links (wiki-links) ────────────────────────────────────
  const allEntries = useEntryStore.getState().entries;
  const wikiLinks = extractWikiLinks(entry.rawText);
  const resolved = resolveWikiLinks(wikiLinks, allEntries);

  // Link this entry to the targets
  const linkedIds = resolved
    .filter(l => l.targetId !== null)
    .map(l => l.targetId!);
  updates.linkedEntryIds = [...new Set(linkedIds)];

  // Update target entries to backlink to this entry
  for (const link of resolved) {
    if (link.targetId && link.targetId !== entry.id) {
      const targetEntry = allEntries.find(e => e.id === link.targetId);
      if (targetEntry) {
        const existingLinks = targetEntry.linkedEntryIds || [];
        if (!existingLinks.includes(entry.id)) {
          await db.entries.update(link.targetId, {
            linkedEntryIds: [...existingLinks, entry.id],
          });
        }
      }
    }
  }

  // ─── Generate Markdown Content ────────────────────────────────────────────
  const processedEntry = { ...entry, ...updates };
  updates.markdownContent = generateMarkdown(processedEntry as Entry, allEntries);

  return updates;
}
