'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n';

export default function Navigation() {
  const pathname = usePathname();
  const { t } = useI18n();

  const links = [
    { href: '/', label: t('nav.library'), icon: '📚', active: pathname === '/' },
    { href: '/graph', label: t('nav.graph'), icon: '🕸️', active: pathname === '/graph' },
    { href: '/settings', label: t('nav.settings'), icon: '⚙️', active: pathname === '/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t md:hidden z-30">
      <div className="flex justify-around items-center py-2 px-4 max-w-lg mx-auto">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center px-4 py-1 text-xs transition-colors ${
              link.active
                ? 'text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="text-lg mb-0.5">{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
