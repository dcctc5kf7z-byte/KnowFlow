'use client';

import { useEffect, useMemo } from 'react';
import { useEntryStore } from '@/stores/entryStore';
import { useI18n } from '@/lib/i18n';
import EntryCard from '@/components/entry/EntryCard';

export default function HomePage() {
  const { entries, isLoading, loadEntries } = useEntryStore();
  const { t } = useI18n();

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Smart grouping
  const groups = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recent: typeof entries = [];
    const thisMonth: typeof entries = [];
    const older: typeof entries = [];
    const withLinks: typeof entries = [];

    entries.forEach(entry => {
      const created = new Date(entry.createdAt);
      if (created > oneWeekAgo) {
        recent.push(entry);
      } else if (created > oneMonthAgo) {
        thisMonth.push(entry);
      } else {
        older.push(entry);
      }
      if ((entry.linkedEntryIds || []).length > 0) {
        withLinks.push(entry);
      }
    });

    return { recent, thisMonth, older, withLinks };
  }, [entries]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500">{t('home.loading')}</div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <div className="text-6xl mb-4">📝</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {t('home.empty.title')}
        </h2>
        <p className="text-gray-600 text-center max-w-md">
          {t('home.empty.desc')}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* Stats bar */}
      <div className="mb-6 flex items-center gap-4 text-sm text-gray-500">
        <span>{entries.length} 个条目</span>
        {groups.withLinks.length > 0 && (
          <>
            <span className="text-gray-300">·</span>
            <span>{groups.withLinks.length} 个已关联</span>
          </>
        )}
      </div>

      {/* Recent (this week) */}
      {groups.recent.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-400 rounded-full" />
            本周新捕获
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {groups.recent.map(entry => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </section>
      )}

      {/* This month */}
      {groups.thisMonth.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-blue-400 rounded-full" />
            本月
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {groups.thisMonth.map(entry => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </section>
      )}

      {/* Older */}
      {groups.older.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-gray-300 rounded-full" />
            更早
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {groups.older.map(entry => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
