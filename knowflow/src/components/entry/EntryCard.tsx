'use client';

import Link from 'next/link';
import { Entry } from '@/types/entry';
import { useEntryStore } from '@/stores/entryStore';

interface EntryCardProps {
  entry: Entry;
}

export default function EntryCard({ entry }: EntryCardProps) {
  const { deleteEntry } = useEntryStore();

  const statusIcons: Record<string, string> = {
    pending: '⏸',
    processing: '🔄',
    completed: '✅',
    degraded: '⚠️',
    failed: '❌',
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('确定要删除这条记录吗？')) {
      await deleteEntry(entry.id);
    }
  };

  const cardStatus = entry.cardStatus || { card1: 'pending', card2: 'pending', card3: 'pending', card4: 'pending' };
  const tags = entry.tags || [];
  const keywords = entry.keywords || [];
  const linkedCount = (entry.linkedEntryIds || []).length;

  // Calculate processing progress
  const statusValues = Object.values(cardStatus);
  const completedCount = statusValues.filter(s => s === 'completed' || s === 'degraded').length;
  const progress = Math.round((completedCount / 4) * 100);

  return (
    <div className="relative group">
      <Link href={`/library/?id=${entry.id}`}>
        <div className="p-4 bg-white border rounded-lg hover:shadow-md transition-all cursor-pointer min-h-[140px] flex flex-col">
          {/* Top row: title + status */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-gray-900 line-clamp-2 flex-1">{entry.title}</h3>
            <span className="text-sm flex-shrink-0" title={`Card 1: ${cardStatus.card1}`}>
              {statusIcons[cardStatus.card1]}
            </span>
          </div>

          {/* Summary preview */}
          {entry.summary && (
            <p className="mt-2 text-sm text-gray-500 line-clamp-2 flex-shrink-0">
              {entry.summary}
            </p>
          )}

          {/* Keywords preview (first 3) */}
          {keywords.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1 flex-shrink-0">
              {keywords.slice(0, 3).map(kw => (
                <span
                  key={kw}
                  className="px-1.5 py-0.5 text-[10px] bg-amber-50 text-amber-700 rounded"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}

          {/* Spacer to push bottom content down */}
          <div className="flex-1" />

          {/* Bottom row: tags + meta */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="px-1.5 py-0.5 text-xs text-gray-400">
                  +{tags.length - 3}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {linkedCount > 0 && (
                <span className="text-blue-400" title={`${linkedCount} 个关联条目`}>
                  🔗 {linkedCount}
                </span>
              )}
              <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Progress bar */}
          {progress > 0 && progress < 100 && (
            <div className="mt-2 h-0.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </Link>

      {/* Delete button - visible on hover */}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity
                   bg-white border rounded-full w-7 h-7 flex items-center justify-center
                   text-red-500 hover:bg-red-50 hover:border-red-200 text-sm shadow-sm"
        title="删除"
      >
        ✕
      </button>
    </div>
  );
}
