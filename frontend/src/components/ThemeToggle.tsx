import { useTheme } from '../theme/useTheme';

type ThemeToggleProps = {
  variant?: 'default' | 'menu';
};

export function ThemeToggle({ variant = 'default' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const options = [
    { value: 'light' as const, label: 'Light' },
    { value: 'dark' as const, label: 'Dark' },
    { value: 'system' as const, label: 'System' },
  ];

  return (
    <div className={`theme-toggle theme-toggle--${variant}`} role="group" aria-label="Theme selection">
      {options.map((option) => (
        <button
          key={option.value}
          className={`theme-toggle__option theme-toggle__option--${variant} ${theme === option.value ? 'theme-toggle__option--active' : ''}`}
          type="button"
          onClick={() => setTheme(option.value)}
          aria-pressed={theme === option.value}
          title={`Use ${option.label.toLowerCase()} theme`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
