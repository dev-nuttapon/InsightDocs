import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { resetPassword } from '../api/authApi';
import { useTranslation } from '../../../i18n/useTranslation';
import { isDemoModeEnabled } from '../../../shared/mock/demoMode';

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const demoMode = isDemoModeEnabled();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="auth-view">
      <div className="auth-card stack">
        <div className="auth-header">
          <div className="auth-brand">ID</div>
          <h2 className="auth-title">{t('auth.resetPasswordTitle')}</h2>
          <p className="muted">{t('auth.resetPasswordDescription')}</p>
        </div>

        {!token ? <div className="callout callout--danger">{t('auth.missingResetToken')}</div> : null}
        {error ? <div className="callout callout--danger">{error}</div> : null}
        {notice ? <div className="callout">{notice}</div> : null}

        <form
          className="stack"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!token) return;

            setIsSubmitting(true);
            try {
              if (!demoMode) {
                await resetPassword(token, password);
              }
              setNotice(t('auth.resetPasswordNotice'));
              setError(null);
              setPassword('');
            } catch (submitError) {
              setError(submitError instanceof Error ? submitError.message : t('auth.resetPasswordError'));
              setNotice(null);
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <div className="stack">
            <span className="card__label">{t('profile.newPassword')}</span>
            <input 
              className="input input--large" 
              type="password" 
              placeholder={t('auth.passwordDots')} 
              value={password} 
              onChange={(event) => setPassword(event.target.value)} 
              required
              disabled={!token}
            />
          </div>
          <button className="button button--large auth-submit-button" disabled={isSubmitting || !token} type="submit">
            {isSubmitting ? t('auth.updatingPassword') : t('auth.resetPasswordAction')}
          </button>
        </form>

        <div className="actions auth-footer-actions">
          <Link className="button button--secondary" to="/login">{t('auth.backToSignIn')}</Link>
        </div>
      </div>
    </div>
  );
}
