import { extractKeywords } from '@/lib/utils/keywords';

describe('extractKeywords', () => {
  it('extracts keywords by frequency', () => {
    const text = 'apple banana apple cherry apple banana';
    const result = extractKeywords(text, 3);
    expect(result[0]).toBe('apple');   // 3 occurrences
    expect(result[1]).toBe('banana');  // 2 occurrences
    expect(result[2]).toBe('cherry');  // 1 occurrence
  });

  it('filters stop words', () => {
    const text = 'the quick brown fox is very fast';
    const result = extractKeywords(text, 10);
    expect(result).not.toContain('the');
    expect(result).not.toContain('is');
    // 'very' is not in the stop word list, so it will be included
    expect(result).toContain('quick');
    expect(result).toContain('brown');
    expect(result).toContain('fox');
    expect(result).toContain('fast');
  });

  it('filters words with 2 or fewer characters', () => {
    const text = 'go to the big red dog';
    const result = extractKeywords(text, 10);
    expect(result).not.toContain('go');
    expect(result).not.toContain('to');
    expect(result).toContain('big');
    expect(result).toContain('red');
    expect(result).toContain('dog');
  });

  it('respects count parameter', () => {
    const text = 'one two three four five six seven eight';
    expect(extractKeywords(text, 3)).toHaveLength(3);
    expect(extractKeywords(text, 5)).toHaveLength(5);
  });

  it('defaults to 5 keywords', () => {
    const text = 'alpha beta gamma delta epsilon zeta eta theta';
    expect(extractKeywords(text)).toHaveLength(5);
  });

  it('returns empty array for empty text', () => {
    expect(extractKeywords('')).toEqual([]);
  });

  it('returns empty array for text with only stop words', () => {
    expect(extractKeywords('the a an and or but')).toEqual([]);
  });

  it('strips punctuation before processing', () => {
    const text = 'hello! world. test, foo; bar:';
    const result = extractKeywords(text, 10);
    expect(result).toContain('hello');
    expect(result).toContain('world');
    expect(result).toContain('test');
  });

  it('is case-insensitive', () => {
    const text = 'Apple APPLE apple';
    const result = extractKeywords(text, 1);
    expect(result[0]).toBe('apple');
  });
});
