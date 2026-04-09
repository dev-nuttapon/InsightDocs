import { useTheme } from '../theme/useTheme';

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="theme-toggle" role="group" aria-label="Theme selection">
      <button
        className="theme-toggle__button"
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
        title={`Current theme: ${theme}. Click to switch to ${isDark ? 'light' : 'dark'}.`}
      >
        <span className="theme-toggle__icon" aria-hidden="true">{isDark ? '☾' : '☀'}</span>
        <span>{isDark ? 'Dark' : 'Light'}</span>
      </button>

      <button
        className={`theme-toggle__mode ${theme === 'system' ? 'theme-toggle__mode--active' : ''}`}
        type="button"
        onClick={() => setTheme('system')}
        aria-pressed={theme === 'system'}
        title="Use system theme"
      >
        System
      </button>
    </div>
  );
}
