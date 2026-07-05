import { detectLanguage } from '@/lib/utils/language';

describe('detectLanguage', () => {
  it('detects Chinese text', () => {
    expect(detectLanguage('这是中文文本')).toBe('zh');
  });

  it('detects Japanese text (hiragana/katakana)', () => {
    expect(detectLanguage('こんにちは ありがとう')).toBe('ja');
  });

  it('detects Korean text', () => {
    expect(detectLanguage('이것은 한국어 텍스트입니다')).toBe('ko');
  });

  it('defaults to English for Latin text', () => {
    expect(detectLanguage('This is English text')).toBe('en');
  });

  it('defaults to English for empty string', () => {
    expect(detectLanguage('')).toBe('en');
  });

  it('detects Chinese in mixed text', () => {
    expect(detectLanguage('Hello 你好 world')).toBe('zh');
  });

  it('detects Japanese in mixed text (katakana only, no CJK)', () => {
    // Note: mixed text with CJK ideographs (漢字) will be detected as Chinese
    // because the Chinese regex runs first. Pure kana in mixed text detects as Japanese.
    expect(detectLanguage('Hello コンニチワ world')).toBe('ja');
  });

  it('detects Korean in mixed text', () => {
    expect(detectLanguage('Hello 안녕 world')).toBe('ko');
  });

  it('defaults to English for numbers only', () => {
    expect(detectLanguage('12345')).toBe('en');
  });

  it('defaults to English for punctuation only', () => {
    expect(detectLanguage('!@#$%')).toBe('en');
  });
});
