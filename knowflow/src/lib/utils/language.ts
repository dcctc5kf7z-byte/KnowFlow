export function detectLanguage(text: string): string {
  // Simple heuristic-based language detection
  // In production, use franc-min or browser API
  const chineseRegex = /[一-龥]/;
  const japaneseRegex = /[぀-ゟ゠-ヿ]/;
  const koreanRegex = /[가-힯]/;

  if (chineseRegex.test(text)) return 'zh';
  if (japaneseRegex.test(text)) return 'ja';
  if (koreanRegex.test(text)) return 'ko';

  // Default to English
  return 'en';
}
