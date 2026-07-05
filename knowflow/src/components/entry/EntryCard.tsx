import Link from 'next/link';
import { Entry } from '@/types/entry';

interface EntryCardProps {
  entry: Entry;
}

export default function EntryCard({ entry }: EntryCardProps) {
  const statusIcons = {
    pending: '⏸',
    processing: '🔄',
    completed: '✅',
    degraded: '⚠️',
    failed: '❌',
  };

  return (
    <Link href={`/library/${entry.id}`}>
      <div className="p-4 bg-white border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between">
          <h3 className="font-medium text-gray-900 line-clamp-2">{entry.title}</h3>
          <span className="text-sm" title={`Card 1: ${entry.cardStatus.card1}`}>
            {statusIcons[entry.cardStatus.card1]}
          </span>
        </div>
        {entry.summary && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{entry.summary}</p>
        )}
        {entry.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {entry.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
              >
                {tag}
              </span>
            ))}
            {entry.tags.length > 3 && (
              <span className="px-2 py-0.5 text-xs text-gray-500">
                +{entry.tags.length - 3}
              </span>
            )}
          </div>
        )}
        <div className="mt-2 text-xs text-gray-400">
          {new Date(entry.createdAt).toLocaleDateString()}
        </div>
      </div>
    </Link>
  );
}
