'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/lib/i18n';

export default function Navigation() {
  const pathname = usePathname();
  const { t } = useI18n();
  const toggleSearch = useUIStore(state => state.toggleSearch);

  const links = [
    { href: '/', label: t('nav.library') || '知识库', icon: '📚', active: pathname === '/' },
    { href: '/graph', label: t('nav.graph') || '图谱', icon: '🕸️', active: pathname === '/graph' },
    { type: 'search' as const, label: t('nav.search') || '搜索', icon: '🔍' },
    { href: '/settings', label: t('nav.settings') || '设置', icon: '⚙️', active: pathname === '/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t md:hidden z-30 safe-area-bottom">
      <div className="flex justify-around items-center py-2 px-2 max-w-lg mx-auto">
        {links.map((link, i) => {
          if ('type' in link && link.type === 'search') {
            return (
              <button
                key="search"
                onClick={toggleSearch}
                className="flex flex-col items-center px-3 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <span className="text-lg mb-0.5">{link.icon}</span>
                <span>{link.label}</span>
              </button>
            );
          }
          return (
            <Link
              key={link.href}
              href={link.href!}
              className={`flex flex-col items-center px-3 py-1 text-xs transition-colors ${
                link.active
                  ? 'text-blue-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-lg mb-0.5">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
