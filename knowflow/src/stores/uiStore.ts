import { create } from 'zustand';

export type Language = 'en' | 'zh';

interface UIState {
  isOnline: boolean;
  apiMode: 'active' | 'degraded' | 'offline';
  consecutiveApiSuccesses: number;
  pendingSyncCount: number;
  isSearchOpen: boolean;
  isCaptureOpen: boolean;
  language: Language;
  setOnline: (online: boolean) => void;
  setApiMode: (mode: 'active' | 'degraded' | 'offline') => void;
  incrementApiSuccess: () => void;
  resetApiSuccess: () => void;
  setPendingSyncCount: (count: number) => void;
  toggleSearch: () => void;
  toggleCapture: () => void;
  setLanguage: (lang: Language) => void;
  /** Call once on client mount to load saved language preference */
  initLanguage: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  apiMode: 'active',
  consecutiveApiSuccesses: 0,
  pendingSyncCount: 0,
  isSearchOpen: false,
  isCaptureOpen: false,
  language: 'en', // Always start with 'en' to match SSR

  setOnline: (online) => set({ isOnline: online }),
  setApiMode: (mode) => set({ apiMode: mode }),
  incrementApiSuccess: () => set(state => ({
    consecutiveApiSuccesses: state.consecutiveApiSuccesses + 1,
  })),
  resetApiSuccess: () => set({ consecutiveApiSuccesses: 0 }),
  setPendingSyncCount: (count) => set({ pendingSyncCount: count }),
  toggleSearch: () => set(state => ({ isSearchOpen: !state.isSearchOpen })),
  toggleCapture: () => set(state => ({ isCaptureOpen: !state.isCaptureOpen })),
  setLanguage: (lang) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('knowflow-language', lang);
    }
    set({ language: lang });
  },
  initLanguage: () => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('knowflow-language');
    if (saved === 'zh' || saved === 'en') {
      set({ language: saved });
    } else if (navigator.language.startsWith('zh')) {
      set({ language: 'zh' });
    }
  },
}));
