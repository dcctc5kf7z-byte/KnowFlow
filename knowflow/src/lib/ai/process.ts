import { Entry, ProcessingScenario } from '@/types/entry';
import { processLocally, LocalAIResult } from './local';
import { processCardWithAPI, AIGenerateResult } from './api';
import { withFallback } from './fallback';
import { db } from '@/lib/db/dexie';
import { useNodeStore } from '@/stores/nodeStore';

/** Extract the usable result — API wraps in AIGenerateResult, local returns LocalAIResult directly */
function unwrapResult(result: AIGenerateResult<unknown> | LocalAIResult): LocalAIResult {
  if ('success' in result && result.success && result.data) {
    return result.data.result as LocalAIResult;
  }
  // If it's already a LocalAIResult (from fallback) or API failed, use directly
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
    updates.summary = data.summary;
    updates.keywords = data.keywords;
    updates.cardStatus = {
      ...updates.cardStatus!,
      card2: degraded ? 'degraded' : 'completed',
    };
  }

  // Card 3: Recommended Angles
  if (scenario === 'deep_digest' || scenario === 'writing_material') {
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
      // Check if node already exists
      const existingNode = nodes.find(n => n.label.toLowerCase() === keyword.toLowerCase());
      if (existingNode) {
        nodeIds.push(existingNode.id);
        // Add this entry to the node's entryIds
        if (!existingNode.entryIds.includes(entry.id)) {
          await db.nodes.update(existingNode.id, {
            entryIds: [...existingNode.entryIds, entry.id],
          });
        }
      } else {
        // Create new node
        const node = await createNode('keyword', keyword);
        nodeIds.push(node.id);
      }
    }

    updates.extractedNodes = nodeIds;
  }

  return updates;
}
