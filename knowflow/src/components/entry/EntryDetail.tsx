'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Entry } from '@/types/entry';
import { useEntryStore } from '@/stores/entryStore';
import { useI18n } from '@/lib/i18n';
import { processEntry } from '@/lib/ai/process';
import Button from '@/components/ui/Button';

interface EntryDetailProps {
  entry: Entry;
  onUpdate?: () => void;
}

export default function EntryDetail({ entry, onUpdate }: EntryDetailProps) {
  const { t } = useI18n();
  const { updateEntry, deleteEntry } = useEntryStore();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const statusIcons: Record<string, string> = {
    pending: '⏸',
    processing: '🔄',
    completed: '✅',
    degraded: '⚠️',
    failed: '❌',
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      const updates = await processEntry(entry, entry.scenario);
      await updateEntry(entry.id, updates);
      onUpdate?.();
    } catch (error) {
      console.error('Processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    await deleteEntry(entry.id);
    router.push('/');
  };

  const cardStatus = entry.cardStatus || { card1: 'pending', card2: 'pending', card3: 'pending', card4: 'pending' };
  const angles = entry.angles || [];
  const goldenQuotes = entry.goldenQuotes || [];
  const tags = entry.tags || [];

  const hasPendingCards = Object.values(cardStatus).some(s => s === 'pending' || s === 'failed');

  const cards = [
    { key: 'card1', title: t('detail.input'), content: entry.rawText },
    { key: 'card2', title: t('detail.categorize'), content: entry.summary || entry.category || '' },
    {
      key: 'card3',
      title: t('detail.angles'),
      content: angles.length > 0
        ? angles.map(a => `${a.selected ? '☑' : '☐'} ${a.text}`).join('\n')
        : '',
    },
    {
      key: 'card4',
      title: t('detail.extract'),
      content: goldenQuotes.length > 0
        ? goldenQuotes.map(q => `"${q.text}"`).join('\n')
        : '',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 bg-white border rounded-lg">
        <h2 className="text-xl font-semibold">{entry.title}</h2>
        <div className="mt-2 text-sm text-gray-500">
          {new Date(entry.createdAt).toLocaleString()}
        </div>

        {/* Action buttons */}
        <div className="mt-3 flex gap-2 flex-wrap">
          {hasPendingCards && (
            <Button size="sm" onClick={handleProcess} disabled={isProcessing}>
              {isProcessing ? '🔄 处理中...' : '▶️ ' + (t('detail.process') || '处理卡片')}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 hover:bg-red-50"
          >
            🗑 {t('detail.delete') || '删除'}
          </Button>
        </div>

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 mb-2">
              {t('detail.deleteConfirm') || '确定要删除这条记录吗？此操作不可撤销。'}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                {t('detail.cancel') || '取消'}
              </Button>
              <Button
                size="sm"
                onClick={handleDelete}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {t('detail.confirmDelete') || '确认删除'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Card status indicators */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {cards.map(card => (
          <div
            key={card.key}
            className="flex-shrink-0 px-3 py-2 bg-gray-100 rounded-lg text-sm"
          >
            {statusIcons[cardStatus[card.key as keyof typeof cardStatus]]}{' '}
            {card.title}
          </div>
        ))}
      </div>

      {/* Card content */}
      <div className="space-y-4">
        {cards.map(card => (
          <div key={card.key} className="p-4 bg-white border rounded-lg">
            <h3 className="font-medium mb-2">{card.title}</h3>
            {card.content ? (
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {card.content}
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic">{t('detail.notProcessed')}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
