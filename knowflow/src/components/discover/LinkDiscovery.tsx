'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useEntryStore } from '@/stores/entryStore';
import { findPotentialConnections } from '@/lib/ai/digest';

interface SuggestedLink {
  sourceId: string;
  sourceTitle: string;
  targetId: string;
  targetTitle: string;
  reason: string;
}

export default function LinkDiscovery() {
  const { entries, updateEntry } = useEntryStore();
  const router = useRouter();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Find all potential connections across all entries
  const suggestions = useMemo(() => {
    if (entries.length < 3) return [];

    const allSuggestions: SuggestedLink[] = [];
    const seen = new Set<string>();

    entries.forEach(entry => {
      const connections = findPotentialConnections(entry, entries, 2);
      connections.forEach(conn => {
        const key = [entry.id, conn.entryId].sort().join('-');
        if (!seen.has(key)) {
          seen.add(key);
          allSuggestions.push({
            sourceId: entry.id,
            sourceTitle: entry.title,
            targetId: conn.entryId,
            targetTitle: conn.entryTitle,
            reason: conn.reason,
          });
        }
      });
    });

    return allSuggestions.slice(0, 5);
  }, [entries]);

  const visibleSuggestions = suggestions.filter(s => {
    const key = [s.sourceId, s.targetId].sort().join('-');
    return !dismissed.has(key);
  });

  if (visibleSuggestions.length === 0) return null;

  const handleLink = async (suggestion: SuggestedLink) => {
    // Add bidirectional wiki-links
    const sourceEntry = entries.find(e => e.id === suggestion.sourceId);
    const targetEntry = entries.find(e => e.id === suggestion.targetId);

    if (sourceEntry && targetEntry) {
      // Add link reference to source
      const sourceLinks = sourceEntry.linkedEntryIds || [];
      if (!sourceLinks.includes(suggestion.targetId)) {
        await updateEntry(suggestion.sourceId, {
          linkedEntryIds: [...sourceLinks, suggestion.targetId],
        });
      }

      // Add link reference to target
      const targetLinks = targetEntry.linkedEntryIds || [];
      if (!targetLinks.includes(suggestion.sourceId)) {
        await updateEntry(suggestion.targetId, {
          linkedEntryIds: [...targetLinks, suggestion.sourceId],
        });
      }

      // Add wiki-link text to raw text if not already present
      if (!sourceEntry.rawText.includes(`[[${suggestion.targetTitle}]]`)) {
        await updateEntry(suggestion.sourceId, {
          rawText: sourceEntry.rawText + `\n\n关联: [[${suggestion.targetTitle}]]`,
        });
      }
    }

    dismiss(suggestion);
  };

  const dismiss = (suggestion: SuggestedLink) => {
    const key = [suggestion.sourceId, suggestion.targetId].sort().join('-');
    setDismissed(prev => new Set([...prev, key]));
  };

  return (
    <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🔗</span>
        <h2 className="font-semibold text-gray-900">发现关联</h2>
        <span className="text-xs text-gray-400 ml-auto">{visibleSuggestions.length} 个建议</span>
      </div>

      <p className="text-sm text-gray-600 mb-3">
        AI 发现了以下知识之间的潜在关联——点击关联将它们连接起来。
      </p>

      <div className="space-y-2">
        {visibleSuggestions.map((s, i) => (
          <div
            key={`${s.sourceId}-${s.targetId}`}
            className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm border border-gray-100"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-sm">
                <button
                  onClick={() => router.push(`/library/?id=${s.sourceId}`)}
                  className="font-medium text-blue-600 hover:underline truncate max-w-[120px]"
                >
                  {s.sourceTitle}
                </button>
                <span className="text-gray-400">↔</span>
                <button
                  onClick={() => router.push(`/library/?id=${s.targetId}`)}
                  className="font-medium text-blue-600 hover:underline truncate max-w-[120px]"
                >
                  {s.targetTitle}
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{s.reason}</div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={() => handleLink(s)}
                className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
              >
                关联
              </button>
              <button
                onClick={() => dismiss(s)}
                className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
