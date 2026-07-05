import { detectLanguage } from '@/lib/utils/language';
import { extractKeywords } from '@/lib/utils/keywords';
import { Entry, Angle, GoldenQuote } from '@/types/entry';

export interface LocalAIResult {
  language: string;
  title: string;
  tags: string[];
  category: string;
  subCategory?: string;
  summary: string;
  keywords: string[];
  angles: Angle[];
  goldenQuotes: GoldenQuote[];
}

export function processCard1(rawText: string): Pick<LocalAIResult, 'language' | 'title' | 'tags'> {
  const language = detectLanguage(rawText);
  const title = rawText.slice(0, 50) + (rawText.length > 50 ? '...' : '');
  const tags = extractKeywords(rawText, 3);

  return { language, title, tags };
}

export function processCard2(rawText: string): Pick<LocalAIResult, 'category' | 'summary' | 'keywords'> {
  // Simple template-based categorization
  const categories = [
    'Technology', 'Science', 'Philosophy', 'Business', 'Health',
    'Education', 'Entertainment', 'Politics', 'Sports', 'Other',
  ];

  const keywords = extractKeywords(rawText, 5);
  const category = categories[Math.floor(Math.random() * categories.length)];
  const summary = rawText.split('.').slice(0, 2).join('.') + '.';

  return { category, summary, keywords };
}

export function processCard3(rawText: string): Pick<LocalAIResult, 'angles'> {
  const angles: Angle[] = [
    { id: crypto.randomUUID(), text: 'What are the practical applications?', selected: false, source: 'local' },
    { id: crypto.randomUUID(), text: 'What are the potential risks?', selected: false, source: 'local' },
    { id: crypto.randomUUID(), text: 'How does this compare to alternatives?', selected: false, source: 'local' },
  ];

  return { angles };
}

export function processCard4(rawText: string): Pick<LocalAIResult, 'goldenQuotes'> {
  // Simple quote extraction (first sentence)
  const sentences = rawText.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const goldenQuotes: GoldenQuote[] = sentences.slice(0, 2).map(text => ({
    id: crypto.randomUUID(),
    text: text.trim(),
  }));

  return { goldenQuotes };
}

export function processLocally(rawText: string): LocalAIResult {
  const card1 = processCard1(rawText);
  const card2 = processCard2(rawText);
  const card3 = processCard3(rawText);
  const card4 = processCard4(rawText);

  return {
    ...card1,
    ...card2,
    ...card3,
    ...card4,
  };
}
