'use client';

import { Entry } from '@/types/entry';

interface Card3Props {
  entry: Entry;
  onUpdate: (updates: Partial<Entry>) => void;
}

export default function Card3Angles({ entry, onUpdate }: Card3Props) {
  const angles = entry.angles || [];

  const toggleAngle = (angleId: string) => {
    const updatedAngles = angles.map(angle =>
      angle.id === angleId ? { ...angle, selected: !angle.selected } : angle
    );
    onUpdate({ angles: updatedAngles });
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-2">
        Select angles that interest you (optional):
      </div>
      <div className="space-y-2">
        {angles.map(angle => (
          <label
            key={angle.id}
            className={`block p-3 border rounded-lg cursor-pointer ${
              angle.selected
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={angle.selected}
                onChange={() => toggleAngle(angle.id)}
                className="mt-1"
              />
              <div>
                <div className="text-sm font-medium">{angle.text}</div>
                <div className="text-xs text-gray-500">
                  {angle.source === 'ai' ? '🤖 AI suggested' : '📝 Rule-based'}
                </div>
              </div>
            </div>
          </label>
        ))}
      </div>
      {angles.length === 0 && (
        <div className="text-center text-gray-500 py-4">
          No angles generated yet. Process this card to get recommendations.
        </div>
      )}
    </div>
  );
}
