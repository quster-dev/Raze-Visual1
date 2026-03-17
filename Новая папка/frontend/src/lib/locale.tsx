import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

export type Locale = 'en' | 'ru';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  toggleLocale: () => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);
const localeKey = 'maven_locale';

export function LocaleProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const stored = localStorage.getItem(localeKey);
    if (stored === 'en' || stored === 'ru') {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(localeKey, next);
  };

  const toggleLocale = () => setLocale(locale === 'en' ? 'ru' : 'en');

  const value = useMemo(() => ({ locale, setLocale, toggleLocale }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return context;
}
