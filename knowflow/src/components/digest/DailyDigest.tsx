'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEntryStore } from '@/stores/entryStore';
import { generateDailyDigest, DailyDigest as DigestType } from '@/lib/ai/digest';
import { useI18n } from '@/lib/i18n';

export default function DailyDigest() {
  const { entries } = useEntryStore();
  const { t } = useI18n();
  const router = useRouter();
  const [digest, setDigest] = useState<DigestType | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (entries.length >= 2) {
      const d = generateDailyDigest(entries);
      setDigest(d);
    }
  }, [entries]);

  if (!digest || entries.length < 2) return null;

  return (
    <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🧠</span>
        <h2 className="font-semibold text-gray-900">每日知识回顾</h2>
        <span className="text-xs text-gray-400 ml-auto">{digest.date}</span>
      </div>

      <p className="text-sm text-gray-600 mb-4">{digest.insight}</p>

      <div className="space-y-3">
        {digest.entries.map((item, i) => (
          <div
            key={item.entry.id}
            className="bg-white rounded-lg p-3 shadow-sm border border-gray-100"
          >
            <button
              onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
              className="w-full text-left"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">
                    {item.entry.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {item.reason}
                  </div>
                </div>
                <span className="text-gray-400 text-xs flex-shrink-0">
                  {expandedIndex === i ? '▲' : '▼'}
                </span>
              </div>
            </button>

            {expandedIndex === i && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                {/* Reflection prompt */}
                <div className="p-2 bg-amber-50 rounded-lg">
                  <div className="text-xs text-amber-700 font-medium mb-1">💡 思考提示</div>
                  <div className="text-sm text-amber-900">{item.reflection}</div>
                </div>

                {/* Connections */}
                {item.connections.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">🔗 可能的关联</div>
                    <div className="space-y-1">
                      {item.connections.map(conn => (
                        <button
                          key={conn.entryId}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/library/?id=${conn.entryId}`);
                          }}
                          className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {conn.entryTitle}
                          <span className="text-gray-400 text-xs ml-1">— {conn.reason}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/library/?id=${item.entry.id}`)}
                    className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    查看详情
                  </button>
                  <button
                    onClick={() => {
                      // Link connections
                      const links = item.connections.map(c => `[[${c.entryTitle}]]`).join(' ');
                      navigator.clipboard.writeText(links);
                    }}
                    className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    复制关联链接
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
