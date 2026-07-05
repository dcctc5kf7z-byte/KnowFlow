import { useUIStore } from '@/stores/uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useUIStore.setState({
      isOnline: true,
      apiMode: 'active',
      consecutiveApiSuccesses: 0,
      pendingSyncCount: 0,
      isSearchOpen: false,
      isCaptureOpen: false,
      language: 'en',
    });
    localStorage.clear();
  });

  describe('setOnline / setApiMode', () => {
    it('sets isOnline', () => {
      useUIStore.getState().setOnline(false);
      expect(useUIStore.getState().isOnline).toBe(false);
    });

    it('sets apiMode', () => {
      useUIStore.getState().setApiMode('degraded');
      expect(useUIStore.getState().apiMode).toBe('degraded');
    });
  });

  describe('incrementApiSuccess / resetApiSuccess', () => {
    it('increments consecutiveApiSuccesses', () => {
      useUIStore.getState().incrementApiSuccess();
      useUIStore.getState().incrementApiSuccess();
      expect(useUIStore.getState().consecutiveApiSuccesses).toBe(2);
    });

    it('resets consecutiveApiSuccesses to 0', () => {
      useUIStore.setState({ consecutiveApiSuccesses: 5 });
      useUIStore.getState().resetApiSuccess();
      expect(useUIStore.getState().consecutiveApiSuccesses).toBe(0);
    });
  });

  describe('toggleSearch / toggleCapture', () => {
    it('toggles isSearchOpen', () => {
      expect(useUIStore.getState().isSearchOpen).toBe(false);
      useUIStore.getState().toggleSearch();
      expect(useUIStore.getState().isSearchOpen).toBe(true);
      useUIStore.getState().toggleSearch();
      expect(useUIStore.getState().isSearchOpen).toBe(false);
    });

    it('toggles isCaptureOpen', () => {
      expect(useUIStore.getState().isCaptureOpen).toBe(false);
      useUIStore.getState().toggleCapture();
      expect(useUIStore.getState().isCaptureOpen).toBe(true);
      useUIStore.getState().toggleCapture();
      expect(useUIStore.getState().isCaptureOpen).toBe(false);
    });
  });

  describe('setLanguage', () => {
    it('sets language in state', () => {
      useUIStore.getState().setLanguage('zh');
      expect(useUIStore.getState().language).toBe('zh');
    });

    it('persists language to localStorage', () => {
      useUIStore.getState().setLanguage('zh');
      expect(localStorage.getItem('knowflow-language')).toBe('zh');
    });

    it('persists English to localStorage', () => {
      useUIStore.getState().setLanguage('en');
      expect(localStorage.getItem('knowflow-language')).toBe('en');
    });
  });

  describe('initLanguage', () => {
    it('loads saved language from localStorage', () => {
      localStorage.setItem('knowflow-language', 'zh');
      useUIStore.getState().initLanguage();
      expect(useUIStore.getState().language).toBe('zh');
    });

    it('falls back to navigator.language for Chinese', () => {
      const original = navigator.language;
      try {
        Object.defineProperty(navigator, 'language', { value: 'zh-CN', configurable: true });

        useUIStore.getState().initLanguage();
        expect(useUIStore.getState().language).toBe('zh');
      } finally {
        Object.defineProperty(navigator, 'language', { value: original, configurable: true });
      }
    });

    it('stays English when navigator is not Chinese and no saved pref', () => {
      localStorage.removeItem('knowflow-language');
      useUIStore.getState().initLanguage();
      expect(useUIStore.getState().language).toBe('en');
    });

    it('ignores invalid localStorage values', () => {
      localStorage.setItem('knowflow-language', 'fr');
      useUIStore.getState().initLanguage();
      // Should fall through to navigator check, which defaults to 'en' in jsdom
      expect(useUIStore.getState().language).toBe('en');
    });
  });

  describe('setPendingSyncCount', () => {
    it('sets pending sync count', () => {
      useUIStore.getState().setPendingSyncCount(42);
      expect(useUIStore.getState().pendingSyncCount).toBe(42);
    });
  });
});
