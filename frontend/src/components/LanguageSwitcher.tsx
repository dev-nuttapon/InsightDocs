import { useTranslation } from '../i18n/useTranslation';

type LanguageSwitcherProps = {
  variant?: 'default' | 'menu';
};

export function LanguageSwitcher({ variant = 'default' }: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useTranslation();
  const options = [
    { value: 'th' as const, label: t('language.thai') },
    { value: 'en' as const, label: t('language.english') },
  ];

  return (
    <div className={`theme-toggle theme-toggle--${variant}`} role="group" aria-label={t('language.label')}>
      {options.map((option) => (
        <button
          key={option.value}
          className={`theme-toggle__option theme-toggle__option--${variant} ${language === option.value ? 'theme-toggle__option--active' : ''}`}
          type="button"
          onClick={() => setLanguage(option.value)}
          aria-pressed={language === option.value}
          title={option.label}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
