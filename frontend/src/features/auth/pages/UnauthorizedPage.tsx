import { Link } from 'react-router-dom';
import { useTranslation } from '../../../i18n/useTranslation';

export function UnauthorizedPage() {
  const { t } = useTranslation();
  return (
    <section className="panel">
      <span className="sidebar__eyebrow">{t('auth.authorizationEyebrow')}</span>
      <h2>{t('auth.accessDeniedTitle')}</h2>
      <p className="muted">
        {t('auth.accessDeniedDescription')}
      </p>
      <div className="actions">
        <Link className="button" to="/">{t('auth.returnToDashboard')}</Link>
        <Link className="button button--secondary" to="/login">{t('auth.switchAccount')}</Link>
      </div>
    </section>
  );
}
