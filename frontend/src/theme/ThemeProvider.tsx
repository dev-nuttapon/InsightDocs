import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

type ThemeContextValue = {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  toggleTheme: () => void;
  setTheme: (theme: ThemePreference) => void;
};

const storageKey = 'insightdocs.theme';

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemePreference>(() => readStoredThemePreference());
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(readStoredThemePreference()));

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    function applyNextTheme(nextTheme: ThemePreference) {
      const nextResolvedTheme = resolveTheme(nextTheme);
      setResolvedTheme(nextResolvedTheme);
      applyThemeToDocument(nextResolvedTheme);
    }

    applyNextTheme(theme);

    function handleSystemThemeChange() {
      if (theme === 'system') {
        applyNextTheme('system');
      }
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme]);

  function setTheme(nextTheme: ThemePreference) {
    setThemeState(nextTheme);
    persistThemePreference(nextTheme);
  }

  function toggleTheme() {
    const nextTheme = resolveTheme(theme) === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  }

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    resolvedTheme,
    toggleTheme,
    setTheme,
  }), [resolvedTheme, theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function initializeTheme() {
  applyThemeToDocument(resolveTheme(readStoredThemePreference()));
}

function readStoredThemePreference(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'system';
  }

  const storedTheme = window.localStorage.getItem(storageKey);
  return isThemePreference(storedTheme) ? storedTheme : 'system';
}

function persistThemePreference(theme: ThemePreference) {
  window.localStorage.setItem(storageKey, theme);
}

function resolveTheme(theme: ThemePreference): ResolvedTheme {
  if (theme === 'light' || theme === 'dark') {
    return theme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeToDocument(theme: ResolvedTheme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
}

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}
