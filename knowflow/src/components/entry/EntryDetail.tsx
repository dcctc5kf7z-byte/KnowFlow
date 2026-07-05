'use client';

import { Entry } from '@/types/entry';
import { useI18n } from '@/lib/i18n';

interface EntryDetailProps {
  entry: Entry;
}

export default function EntryDetail({ entry }: EntryDetailProps) {
  const { t } = useI18n();

  const statusIcons = {
    pending: '⏸',
    processing: '🔄',
    completed: '✅',
    degraded: '⚠️',
    failed: '❌',
  };

  const cards = [
    { key: 'card1', title: t('detail.input'), content: entry.rawText },
    { key: 'card2', title: t('detail.categorize'), content: entry.summary || entry.category },
    { key: 'card3', title: t('detail.angles'), content: entry.angles.map(a => a.text).join('\n') },
    { key: 'card4', title: t('detail.extract'), content: entry.goldenQuotes.map(q => q.text).join('\n') },
  ];

  return (
    <div className="space-y-4">
      <div className="p-4 bg-white border rounded-lg">
        <h2 className="text-xl font-semibold">{entry.title}</h2>
        <div className="mt-2 text-sm text-gray-500">
          {new Date(entry.createdAt).toLocaleString()}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {cards.map(card => (
          <div
            key={card.key}
            className="flex-shrink-0 px-3 py-2 bg-gray-100 rounded-lg text-sm"
          >
            {statusIcons[entry.cardStatus[card.key as keyof typeof entry.cardStatus]]}{' '}
            {card.title}
          </div>
        ))}
      </div>

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
