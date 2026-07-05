import { useUIStore } from '@/stores/uiStore';
import { en, TranslationKey } from './locales/en';
import { zh } from './locales/zh';

const translations = { en, zh };

export function useI18n() {
  const language = useUIStore(state => state.language);

  function t(key: TranslationKey): string {
    return translations[language]?.[key] ?? en[key] ?? key;
  }

  return { t, language };
}
