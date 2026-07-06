export type SyncStatus = 'local' | 'pending' | 'synced' | 'conflict';

export type CardStatusState = 'pending' | 'processing' | 'completed' | 'degraded' | 'failed';

export interface CardStatus {
  card1: CardStatusState;
  card2: CardStatusState;
  card3: CardStatusState;
  card4: CardStatusState;
}

export type ProcessingScenario =
  | 'quick_capture'
  | 'deep_digest'
  | 'writing_material'
  | 'knowledge_link';

export interface Angle {
  id: string;
  text: string;
  selected: boolean;
  source: 'ai' | 'local';
}

export interface GoldenQuote {
  id: string;
  text: string;
  page?: number;
  context?: string;
}

export interface Entry {
  id: string;
  userId: string;
  title: string;
  rawText: string;
  /** Markdown-formatted content for rich rendering */
  markdownContent?: string;
  language: string;
  sourceUrl?: string;
  sourceType?: 'paste' | 'url' | 'file' | 'manual';
  category: string;
  subCategory?: string;
  tags: string[];
  summary: string;
  keywords: string[];
  angles: Angle[];
  goldenQuotes: GoldenQuote[];
  extractedNodes: string[];
  /** IDs of entries linked via [[wiki-links]] */
  linkedEntryIds: string[];
  cardStatus: CardStatus;
  scenario: ProcessingScenario;
  processingMode: 'local' | 'api';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  syncStatus: SyncStatus;
}

/** A backlink — an entry that references the current entry */
export interface Backlink {
  entryId: string;
  entryTitle: string;
  /** The context sentence where the link appears */
  context: string;
  /** Offset of the link reference in the source text */
  offset: number;
}
