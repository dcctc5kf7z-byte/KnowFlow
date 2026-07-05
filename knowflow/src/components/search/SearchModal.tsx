'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/lib/i18n';
import { search, SearchResult } from '@/lib/utils/search';

export default function SearchModal() {
  const { isSearchOpen, toggleSearch } = useUIStore();
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isSearchOpen) {
      inputRef.current?.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim()) {
        setIsLoading(true);
        const searchResults = await search(query);
        setResults(searchResults);
        setIsLoading(false);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'entry') {
      router.push(`/library/${result.id}`);
    } else if (result.type === 'node') {
      // TODO: Navigate to node detail
    }
    toggleSearch();
    setQuery('');
  };

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSearch]);

  return (
    <Modal isOpen={isSearchOpen} onClose={toggleSearch}>
      <div className="space-y-4">
        <div className="relative">
          <span className="absolute left-3 top-3 text-gray-400">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {isLoading && (
          <div className="text-center text-gray-500">{t('search.searching')}</div>
        )}

        {!isLoading && results.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map(result => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleSelect(result)}
                className="w-full text-left p-3 hover:bg-gray-100 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span>{result.type === 'entry' ? '📝' : '🔵'}</span>
                  <span className="font-medium">{result.title}</span>
                </div>
                {result.subtitle && (
                  <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                    {result.subtitle}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {!isLoading && query && results.length === 0 && (
          <div className="text-center text-gray-500">{t('search.noResults')}</div>
        )}
      </div>
    </Modal>
  );
}
