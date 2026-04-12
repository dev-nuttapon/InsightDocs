import { useState } from 'react';
import { Link } from 'react-router-dom';

import { registerUser, type RegisterUserInput } from '../api/authApi';
import { useTranslation } from '../../../i18n/useTranslation';

const initialState: RegisterUserInput = {
  username: '',
  email: '',
  displayName: '',
  password: '',
};

export function RegisterPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="auth-view">
      <div className="auth-card stack">
        <div className="auth-header">
          <div className="auth-brand">ID</div>
          <h2 className="auth-title">{t('auth.registerTitle')}</h2>
          <p className="muted">{t('auth.registerDescription')}</p>
        </div>

        {error ? <div className="callout callout--danger">{error}</div> : null}
        {notice ? <div className="callout">{notice}</div> : null}

        <form
          className="stack"
          onSubmit={async (event) => {
            event.preventDefault();
            setIsSubmitting(true);
            try {
              await registerUser(form);
              setNotice(t('auth.registerNotice'));
              setError(null);
              setForm(initialState);
            } catch (submitError) {
              setError(submitError instanceof Error ? submitError.message : t('auth.registerError'));
              setNotice(null);
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <div className="stack">
            <span className="card__label">{t('auth.accountEmail')}</span>
            <input
              id="register-email"
              className="input input--large"
              placeholder={t('auth.emailPlaceholder')}
              type="email"
              value={form.email}
              onChange={(event) => {
                const email = event.target.value;
                setForm((current) => ({ ...current, email, username: email }));
              }}
              required
            />
          </div>

          <div className="stack">
            <span className="card__label">{t('auth.displayName')}</span>
            <input 
              className="input input--large" 
              placeholder={t('auth.displayNamePlaceholder')} 
              value={form.displayName} 
              onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} 
              required
            />
          </div>

          <div className="stack">
            <span className="card__label">{t('auth.proposedPassword')}</span>
            <input 
              className="input input--large" 
              placeholder={t('auth.passwordDots')} 
              type="password" 
              value={form.password} 
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} 
              required
            />
          </div>

          <button className="button button--large auth-submit-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? t('auth.submittingRegistration') : t('auth.requestAccess')}
          </button>
        </form>

        <div className="actions auth-footer-actions">
          <Link className="button button--secondary" to="/login">{t('auth.alreadyHaveAccount')}</Link>
        </div>
      </div>
    </div>
  );
}
