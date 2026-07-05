import { db } from '@/lib/db/dexie';

describe('Dexie Database', () => {
  it('should have entries table', () => {
    expect(db.tables.some(t => t.name === 'entries')).toBe(true);
  });

  it('should have nodes table', () => {
    expect(db.tables.some(t => t.name === 'nodes')).toBe(true);
  });

  it('should have links table', () => {
    expect(db.tables.some(t => t.name === 'links')).toBe(true);
  });

  it('should have drafts table', () => {
    expect(db.tables.some(t => t.name === 'drafts')).toBe(true);
  });

  it('should have userSettings table', () => {
    expect(db.tables.some(t => t.name === 'userSettings')).toBe(true);
  });

  it('should have syncQueue table', () => {
    expect(db.tables.some(t => t.name === 'syncQueue')).toBe(true);
  });
});
