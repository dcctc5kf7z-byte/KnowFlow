'use client';

import { Entry } from '@/types/entry';

interface Card2Props {
  entry: Entry;
  onUpdate: (updates: Partial<Entry>) => void;
}

export default function Card2Categorize({ entry, onUpdate }: Card2Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <input
          type="text"
          value={entry.category}
          onChange={(e) => onUpdate({ category: e.target.value })}
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Technology, Science, Philosophy"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sub-category
        </label>
        <input
          type="text"
          value={entry.subCategory || ''}
          onChange={(e) => onUpdate({ subCategory: e.target.value })}
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Optional sub-category"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags
        </label>
        <div className="flex flex-wrap gap-2">
          {entry.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
            >
              {tag}
              <button
                onClick={() => onUpdate({ tags: entry.tags.filter(t => t !== tag) })}
                className="ml-1 text-blue-500 hover:text-blue-700"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="Add tag and press Enter"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
              onUpdate({ tags: [...entry.tags, e.currentTarget.value.trim()] });
              e.currentTarget.value = '';
            }
          }}
          className="w-full mt-2 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Summary
        </label>
        <textarea
          value={entry.summary}
          onChange={(e) => onUpdate({ summary: e.target.value })}
          className="w-full h-24 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Brief summary of the content"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Keywords
        </label>
        <div className="flex flex-wrap gap-2">
          {entry.keywords.map(keyword => (
            <span
              key={keyword}
              className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm"
            >
              {keyword}
              <button
                onClick={() => onUpdate({ keywords: entry.keywords.filter(k => k !== keyword) })}
                className="ml-1 text-green-500 hover:text-green-700"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
