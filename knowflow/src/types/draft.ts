export interface Draft {
  id: string;
  userId?: string;
  rawText: string;
  sourceUrl?: string;
  sourceType: 'paste' | 'url' | 'file' | 'manual';
  createdAt: string;
  expiresAt: string;
  convertedToEntryId?: string;
}
