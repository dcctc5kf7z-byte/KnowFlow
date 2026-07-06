'use client';

import Link from 'next/link';
import { useUIStore } from '@/stores/uiStore';
import SearchModal from '@/components/search/SearchModal';

export default function Header() {
  const toggleSearch = useUIStore(state => state.toggleSearch);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="text-xl font-bold text-gray-900 hover:text-gray-700">
            KnowFlow
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSearch}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="搜索"
            >
              🔍
            </button>
            <Link
              href="/settings"
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ⚙️
            </Link>
          </div>
        </div>
      </header>
      <SearchModal />
    </>
  );
}
