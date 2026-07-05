'use client';

import { Entry } from '@/types/entry';

interface Card1Props {
  entry: Entry;
  onUpdate: (updates: Partial<Entry>) => void;
}

export default function Card1Input({ entry, onUpdate }: Card1Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Raw Text
        </label>
        <textarea
          value={entry.rawText}
          onChange={(e) => onUpdate({ rawText: e.target.value })}
          className="w-full h-40 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your knowledge..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Source URL (optional)
        </label>
        <input
          type="url"
          value={entry.sourceUrl || ''}
          onChange={(e) => onUpdate({ sourceUrl: e.target.value })}
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Language
        </label>
        <div className="text-sm text-gray-600">{entry.language}</div>
      </div>
    </div>
  );
}
