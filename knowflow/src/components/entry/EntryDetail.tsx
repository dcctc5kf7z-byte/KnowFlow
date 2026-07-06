'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Entry, Backlink } from '@/types/entry';
import { useEntryStore } from '@/stores/entryStore';
import { useI18n } from '@/lib/i18n';
import { processEntry } from '@/lib/ai/process';
import { buildBacklinks, wikiLinksToMarkdown } from '@/lib/utils/wikiLinks';
import Button from '@/components/ui/Button';

interface EntryDetailProps {
  entry: Entry;
  onUpdate?: () => void;
}

export default function EntryDetail({ entry, onUpdate }: EntryDetailProps) {
  const { t } = useI18n();
  const { updateEntry, deleteEntry, entries } = useEntryStore();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set(['card1']));
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);

  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const statusIcons: Record<string, string> = {
    pending: '⏸',
    processing: '🔄',
    completed: '✅',
    degraded: '⚠️',
    failed: '❌',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-500',
    processing: 'bg-blue-100 text-blue-600',
    completed: 'bg-green-100 text-green-700',
    degraded: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-600',
  };

  // Build backlinks
  useEffect(() => {
    const bl = buildBacklinks(entry.id, entries);
    setBacklinks(bl);
  }, [entry.id, entries]);

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

  const scrollToCard = useCallback((cardKey: string) => {
    const el = cardRefs.current.get(cardKey);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveCard(cardKey);
    }
  }, []);

  const toggleCard = useCallback((cardKey: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(cardKey)) {
        next.delete(cardKey);
      } else {
        next.add(cardKey);
      }
      return next;
    });
    scrollToCard(cardKey);
  }, [scrollToCard]);

  const cardStatus = entry.cardStatus || { card1: 'pending', card2: 'pending', card3: 'pending', card4: 'pending' };
  const angles = entry.angles || [];
  const goldenQuotes = entry.goldenQuotes || [];
  const tags = entry.tags || [];
  const keywords = entry.keywords || [];
  const extractedNodes = entry.extractedNodes || [];
  const linkedEntryIds = entry.linkedEntryIds || [];

  const hasPendingCards = Object.values(cardStatus).some(s => s === 'pending' || s === 'failed');

  // Get linked entries for display
  const linkedEntries = linkedEntryIds
    .map(id => entries.find(e => e.id === id))
    .filter(Boolean) as Entry[];

  const cards = [
    { key: 'card1', title: '📥 ' + (t('detail.input') || '输入与记录'), icon: '📥' },
    { key: 'card2', title: '🧩 ' + (t('detail.categorize') || '归纳与分类'), icon: '🧩' },
    { key: 'card3', title: '❓ ' + (t('detail.angles') || '推荐思考角度'), icon: '❓' },
    { key: 'card4', title: '🔬 ' + (t('detail.extract') || '提炼与关联'), icon: '🔬' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 bg-white border rounded-lg">
        <h2 className="text-xl font-semibold">{entry.title}</h2>
        <div className="mt-2 text-sm text-gray-500">
          {new Date(entry.createdAt).toLocaleString()}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

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

      {/* ─── Clickable Step Bar ─────────────────────────────────────────── */}
      <div className="flex gap-1 overflow-x-auto pb-2 -mx-1 px-1">
        {cards.map(card => {
          const status = cardStatus[card.key as keyof typeof cardStatus];
          const isActive = activeCard === card.key;
          const isExpanded = expandedCards.has(card.key);

          return (
            <button
              key={card.key}
              onClick={() => toggleCard(card.key)}
              className={`
                flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${isActive
                  ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300'
                  : isExpanded
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-white border text-gray-600 hover:bg-gray-50'
                }
              `}
            >
              <span className="mr-1">{statusIcons[status]}</span>
              {card.title}
            </button>
          );
        })}
      </div>

      {/* ─── Expandable Card Content ────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Card 1: Input & Record */}
        <div
          ref={el => { if (el) cardRefs.current.set('card1', el); }}
          className="bg-white border rounded-lg overflow-hidden"
        >
          <button
            onClick={() => toggleCard('card1')}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[cardStatus.card1]}`}>
                {statusIcons[cardStatus.card1]}
              </span>
              <span className="font-medium">{cards[0].title}</span>
            </div>
            <span className="text-gray-400">{expandedCards.has('card1') ? '▲' : '▼'}</span>
          </button>
          {expandedCards.has('card1') && (
            <div className="px-4 pb-4 border-t">
              <div className="mt-3 prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {wikiLinksToMarkdown(entry.rawText, entries)}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Categorize & Classify */}
        <div
          ref={el => { if (el) cardRefs.current.set('card2', el); }}
          className="bg-white border rounded-lg overflow-hidden"
        >
          <button
            onClick={() => toggleCard('card2')}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[cardStatus.card2]}`}>
                {statusIcons[cardStatus.card2]}
              </span>
              <span className="font-medium">{cards[1].title}</span>
            </div>
            <span className="text-gray-400">{expandedCards.has('card2') ? '▲' : '▼'}</span>
          </button>
          {expandedCards.has('card2') && (
            <div className="px-4 pb-4 border-t">
              <div className="mt-3 space-y-3">
                {entry.category && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">分类</span>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="px-2 py-1 text-sm bg-purple-50 text-purple-700 rounded">
                        {entry.category}
                      </span>
                      {entry.subCategory && (
                        <span className="text-gray-400">›</span>
                      )}
                      {entry.subCategory && (
                        <span className="px-2 py-1 text-sm bg-purple-50 text-purple-600 rounded">
                          {entry.subCategory}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {entry.summary && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">摘要</span>
                    <div className="mt-1 prose prose-sm max-w-none text-gray-700">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {entry.summary}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
                {keywords.length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">关键词</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {keywords.map(kw => (
                        <span key={kw} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Card 3: Recommended Angles */}
        <div
          ref={el => { if (el) cardRefs.current.set('card3', el); }}
          className="bg-white border rounded-lg overflow-hidden"
        >
          <button
            onClick={() => toggleCard('card3')}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[cardStatus.card3]}`}>
                {statusIcons[cardStatus.card3]}
              </span>
              <span className="font-medium">{cards[2].title}</span>
            </div>
            <span className="text-gray-400">{expandedCards.has('card3') ? '▲' : '▼'}</span>
          </button>
          {expandedCards.has('card3') && (
            <div className="px-4 pb-4 border-t">
              <div className="mt-3 space-y-2">
                {angles.length > 0 ? (
                  angles.map(angle => (
                    <label
                      key={angle.id}
                      className={`flex items-start gap-2 p-2 rounded cursor-pointer transition-colors ${
                        angle.selected ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={angle.selected}
                        onChange={async () => {
                          const updatedAngles = angles.map(a =>
                            a.id === angle.id ? { ...a, selected: !a.selected } : a
                          );
                          await updateEntry(entry.id, { angles: updatedAngles });
                          onUpdate?.();
                        }}
                        className="mt-0.5 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{angle.text}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 italic">{t('detail.notProcessed')}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Card 4: Extract & Connect */}
        <div
          ref={el => { if (el) cardRefs.current.set('card4', el); }}
          className="bg-white border rounded-lg overflow-hidden"
        >
          <button
            onClick={() => toggleCard('card4')}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[cardStatus.card4]}`}>
                {statusIcons[cardStatus.card4]}
              </span>
              <span className="font-medium">{cards[3].title}</span>
            </div>
            <span className="text-gray-400">{expandedCards.has('card4') ? '▲' : '▼'}</span>
          </button>
          {expandedCards.has('card4') && (
            <div className="px-4 pb-4 border-t">
              <div className="mt-3 space-y-3">
                {goldenQuotes.length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">精华摘录</span>
                    <div className="mt-2 space-y-2">
                      {goldenQuotes.map(quote => (
                        <blockquote
                          key={quote.id}
                          className="pl-3 border-l-2 border-amber-300 text-sm text-gray-700 italic"
                        >
                          {quote.text}
                        </blockquote>
                      ))}
                    </div>
                  </div>
                )}
                {extractedNodes.length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">关联节点</span>
                    <div className="mt-1 text-sm text-gray-600">
                      {extractedNodes.length} 个知识点已提取
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Linked Entries (Bidirectional Links) ───────────────────────── */}
      {linkedEntries.length > 0 && (
        <div className="p-4 bg-white border rounded-lg">
          <h3 className="font-medium text-sm text-gray-500 mb-2">🔗 关联条目</h3>
          <div className="space-y-2">
            {linkedEntries.map(linked => (
              <button
                key={linked.id}
                onClick={() => router.push(`/library/${linked.id}`)}
                className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors group"
              >
                <div className="text-sm font-medium text-blue-600 group-hover:text-blue-800">
                  {linked.title}
                </div>
                {linked.summary && (
                  <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                    {linked.summary}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Backlinks Panel ────────────────────────────────────────────── */}
      {backlinks.length > 0 && (
        <div className="p-4 bg-white border rounded-lg">
          <h3 className="font-medium text-sm text-gray-500 mb-2">↩️ 反向链接</h3>
          <div className="space-y-2">
            {backlinks.map(bl => (
              <button
                key={bl.entryId}
                onClick={() => router.push(`/library/${bl.entryId}`)}
                className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors group"
              >
                <div className="text-sm font-medium text-blue-600 group-hover:text-blue-800">
                  {bl.entryTitle}
                </div>
                <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                  {bl.context}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Markdown Source Toggle ──────────────────────────────────────── */}
      <details className="bg-white border rounded-lg">
        <summary className="px-4 py-3 cursor-pointer text-sm text-gray-500 hover:text-gray-700">
          📝 查看 Markdown 源码
        </summary>
        <div className="px-4 pb-4 border-t">
          <pre className="mt-3 p-3 bg-gray-50 rounded text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">
            {entry.markdownContent || generateSimpleMarkdown(entry)}
          </pre>
        </div>
      </details>
    </div>
  );
}

function generateSimpleMarkdown(entry: Entry): string {
  const lines: string[] = [];
  lines.push(`# ${entry.title}`);
  lines.push('');
  if (entry.summary) lines.push(`> ${entry.summary}`);
  lines.push('');
  lines.push(entry.rawText);
  return lines.join('\n');
}
