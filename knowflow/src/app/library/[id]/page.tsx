'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEntryStore } from '@/stores/entryStore';
import { useI18n } from '@/lib/i18n';
import EntryDetail from '@/components/entry/EntryDetail';

export default function EntryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { currentEntry, isLoading, loadEntry } = useEntryStore();
  const { t } = useI18n();

  useEffect(() => {
    if (id) {
      loadEntry(id);
    }
  }, [id, loadEntry]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500">{t('detail.loading') || '加载中...'}</div>
      </div>
    );
  }

  if (!currentEntry) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-gray-500 mb-4">{t('detail.notFound') || '未找到记录'}</div>
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:underline text-sm"
          >
            ← {t('detail.back') || '返回'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Back button */}
      <button
        onClick={() => router.push('/')}
        className="mb-4 text-blue-600 hover:underline text-sm flex items-center gap-1"
      >
        ← {t('detail.back') || '返回'}
      </button>

      <EntryDetail entry={currentEntry} onUpdate={() => loadEntry(id)} />
    </div>
  );
}
