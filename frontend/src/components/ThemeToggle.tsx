import { useTheme } from '../theme/useTheme';
import { useTranslation } from '../i18n/useTranslation';

type ThemeToggleProps = {
  variant?: 'default' | 'menu';
};

export function ThemeToggle({ variant = 'default' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const options = [
    { value: 'light' as const, label: t('theme.light') },
    { value: 'dark' as const, label: t('theme.dark') },
    { value: 'system' as const, label: t('theme.system') },
  ];

  return (
    <div className={`theme-toggle theme-toggle--${variant}`} role="group" aria-label={t('theme.label')}>
      {options.map((option) => (
        <button
          key={option.value}
          className={`theme-toggle__option theme-toggle__option--${variant} ${theme === option.value ? 'theme-toggle__option--active' : ''}`}
          type="button"
          onClick={() => setTheme(option.value)}
          aria-pressed={theme === option.value}
          title={t('theme.use', { theme: option.label })}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
