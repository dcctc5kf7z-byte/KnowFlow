'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEntryStore } from '@/stores/entryStore';
import { useI18n } from '@/lib/i18n';
import EntryDetail from '@/components/entry/EntryDetail';

function EntryPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');
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

      <EntryDetail entry={currentEntry} onUpdate={() => id && loadEntry(id)} />
    </div>
  );
}

export default function EntryPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="text-gray-500">加载中...</div></div>}>
      <EntryPageContent />
    </Suspense>
  );
}
