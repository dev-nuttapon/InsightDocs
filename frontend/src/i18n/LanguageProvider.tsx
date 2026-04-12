import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { messages, type Language } from './messages';

type TranslationParams = Record<string, string | number>;

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: TranslationParams) => string;
};

const LANGUAGE_STORAGE_KEY = 'insightdocs.language';

export const LanguageContext = createContext<LanguageContextValue | null>(null);

export function getInitialLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'th';
  }

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

  if (stored === 'th' || stored === 'en') {
    return stored;
  }

  const browserLanguage = window.navigator.language.toLowerCase();
  return browserLanguage.startsWith('th') ? 'th' : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => getInitialLanguage());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage: (nextLanguage) => setLanguageState(nextLanguage),
    t: (key, params) => translate(language, key, params),
  }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

function translate(language: Language, key: string, params?: TranslationParams): string {
  const resolved = resolveMessage(messages[language], key);

  if (typeof resolved !== 'string') {
    return key;
  }

  if (!params) {
    return resolved;
  }

  return resolved.replace(/\{\{(\w+)\}\}/g, (_, token: string) => {
    const value = params[token];
    return value === undefined ? '' : String(value);
  });
}

function resolveMessage(source: Record<string, unknown>, key: string): unknown {
  return key.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, source);
}
