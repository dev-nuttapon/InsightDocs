import { useState } from 'react';
import { Link } from 'react-router-dom';

import { createForgotPasswordRequest } from '../api/authApi';
import { useTranslation } from '../../../i18n/useTranslation';
import { isDemoModeEnabled } from '../../../shared/mock/demoMode';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const demoMode = isDemoModeEnabled();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="auth-view">
      <div className="auth-card stack">
        <div className="auth-header">
          <div className="auth-brand">ID</div>
          <h2 className="auth-title">{t('auth.forgotPasswordTitle')}</h2>
          <p className="muted">{t('auth.forgotPasswordDescription')}</p>
        </div>

        {error ? <div className="callout callout--danger">{error}</div> : null}
        {notice ? <div className="callout">{notice}</div> : null}

        <form
          className="stack"
          onSubmit={async (event) => {
            event.preventDefault();
            setIsSubmitting(true);
            try {
              if (!demoMode) {
                await createForgotPasswordRequest(value);
              }
              setNotice(t('auth.forgotPasswordNotice'));
              setError(null);
              setValue('');
            } catch (submitError) {
              setError(submitError instanceof Error ? submitError.message : t('auth.forgotPasswordError'));
              setNotice(null);
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <div className="stack">
            <span className="card__label">{t('auth.accountEmail')}</span>
            <input 
              className="input input--large" 
              placeholder={t('auth.emailPlaceholder')} 
              type="email" 
              value={value} 
              onChange={(event) => setValue(event.target.value)} 
              required
            />
          </div>
          <button className="button button--large auth-submit-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? t('auth.submittingRequest') : t('auth.requestResetLink')}
          </button>
        </form>

        <div className="actions auth-footer-actions">
          <Link className="button button--secondary" to="/login">{t('auth.backToSignIn')}</Link>
        </div>
      </div>
    </div>
  );
}
