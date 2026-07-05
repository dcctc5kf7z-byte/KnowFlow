'use client';

import { useEffect } from 'react';
import { useEntryStore } from '@/stores/entryStore';
import { useI18n } from '@/lib/i18n';
import EntryCard from '@/components/entry/EntryCard';

export default function HomePage() {
  const { entries, isLoading, loadEntries } = useEntryStore();
  const { t } = useI18n();

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

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
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries.map(entry => (
          <EntryCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
