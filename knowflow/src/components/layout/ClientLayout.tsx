'use client';

import { ReactNode, useEffect } from 'react';
import Header from './Header';
import Navigation from './Navigation';
import FAB from './FAB';
import { startSyncListener } from '@/lib/sync/syncManager';
import { useUIStore } from '@/stores/uiStore';

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const initLanguage = useUIStore(state => state.initLanguage);

  useEffect(() => {
    initLanguage();
    startSyncListener();
  }, [initLanguage]);

  return (
    <>
      <Header />
      <main className="pb-20 md:pb-0">{children}</main>
      <Navigation />
      <FAB />
    </>
  );
}
