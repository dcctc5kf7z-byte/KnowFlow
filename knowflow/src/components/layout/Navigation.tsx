'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n';

export default function Navigation() {
  const pathname = usePathname();
  const { t } = useI18n();

  const links = [
    { href: '/', label: t('nav.library'), active: pathname === '/' },
    { href: '/graph', label: t('nav.graph'), active: pathname === '/graph' },
    { href: '/settings', label: t('nav.settings'), active: pathname === '/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden z-30">
      <div className="flex justify-around py-2">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center px-3 py-1 text-sm ${
              link.active ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <span>{link.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
