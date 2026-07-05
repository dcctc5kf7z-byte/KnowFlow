'use client';

import { useUIStore } from '@/stores/uiStore';
import SearchModal from '@/components/search/SearchModal';

export default function Header() {
  const toggleSearch = useUIStore(state => state.toggleSearch);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900">KnowFlow</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSearch}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              🔍
            </button>
            <a
              href="/settings"
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              ⚙️
            </a>
          </div>
        </div>
      </header>
      <SearchModal />
    </>
  );
}
