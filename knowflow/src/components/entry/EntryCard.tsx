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

  const cardStatus = entry.cardStatus || { card1: 'pending' };
  const tags = entry.tags || [];

  return (
    <div className="relative group">
      <Link href={`/library/${entry.id}`}>
        <div className="p-4 bg-white border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-start justify-between">
            <h3 className="font-medium text-gray-900 line-clamp-2">{entry.title}</h3>
            <span className="text-sm" title={`Card 1: ${cardStatus.card1}`}>
              {statusIcons[cardStatus.card1]}
            </span>
          </div>
          {entry.summary && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">{entry.summary}</p>
          )}
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="px-2 py-0.5 text-xs text-gray-500">
                  +{tags.length - 3}
                </span>
              )}
            </div>
          )}
          <div className="mt-2 text-xs text-gray-400">
            {new Date(entry.createdAt).toLocaleDateString()}
          </div>
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
