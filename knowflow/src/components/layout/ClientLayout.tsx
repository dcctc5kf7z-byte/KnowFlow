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

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.warn('SW registration failed:', err);
      });
    }

    // Track online/offline status
    const handleOnline = () => useUIStore.getState().setOnline(true);
    const handleOffline = () => useUIStore.getState().setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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
