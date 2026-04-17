import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { buildAccessProfile, canAccessPath, resolveDefaultAuthorizedPath } from '../../../shared/auth/authorization';
import { useAuth } from '../context/useAuth';
import { useTranslation } from '../../../i18n/useTranslation';
import {
  findDemoRoleByCredentials,
  getAvailableDemoRoles,
  getDefaultDemoRole,
  getDemoCredentials,
  getDemoRoleColorToken,
  getDemoRoleTranslationKey,
  type DemoRolePreset,
} from '../../../shared/mock/demoAuth';
import { isDemoModeEnabled } from '../../../shared/mock/demoMode';
import { Icons } from '../../../shared/components/ui/Icons';

export function LoginPage() {
  const location = useLocation();
  const { t } = useTranslation();
  const { authState, isAuthenticated, isReady, login, error, user } = useAuth();
  const demoMode = isDemoModeEnabled();
  const defaultDemoRole = getDefaultDemoRole();
  const [selectedDemoRole, setSelectedDemoRole] = useState<DemoRolePreset>(defaultDemoRole);
  const [credentials, setCredentials] = useState(() => getDemoCredentials(defaultDemoRole));
  const [credentialError, setCredentialError] = useState<string | null>(null);
  const redirectTarget = readRedirectTarget(location.state);
  const entryError = readEntryError(location.state) ?? error;
  const isExpiredSession = authState === 'expired' || isExpiredSessionMessage(entryError);
  const loginStartedRef = useRef(false);
  const access = buildAccessProfile(user?.roles ?? []);
  const hasMappedAccess = access.normalizedRoles.length > 0;
  const authorizedTarget = hasMappedAccess && canAccessPath(access, redirectTarget)
    ? redirectTarget
    : resolveDefaultAuthorizedPath(access);

  useEffect(() => {
    if (!isReady || isAuthenticated || loginStartedRef.current || (entryError && !isExpiredSession) || demoMode) {
      return;
    }

    loginStartedRef.current = true;
    void login(redirectTarget).catch(() => {
      loginStartedRef.current = false;
    });
  }, [demoMode, entryError, isAuthenticated, isExpiredSession, isReady, login, redirectTarget]);

  if (isAuthenticated && !hasMappedAccess) {
    return <Navigate replace to="/unauthorized" state={{ errorMessage: t('auth.noMappedRoles') }} />;
  }

  if (isAuthenticated) {
    return <Navigate replace to={authorizedTarget} />;
  }

  const isBusy = !isReady || authState === 'loading';
  const heading = entryError && !isExpiredSession
    ? t('auth.loginAttentionTitle')
    : authState === 'expired'
      ? t('auth.sessionExpiredTitle')
      : t('auth.checkingSessionTitle');
  const description = entryError && !isExpiredSession
    ? t('auth.loginAttentionDescription')
    : authState === 'expired'
      ? t('auth.sessionExpiredDescription')
      : t('auth.checkingSessionDescription');

  const handleDemoCredentialSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const matchedRole = findDemoRoleByCredentials(credentials.email, credentials.password);
    if (!matchedRole) {
      setCredentialError(t('auth.demoInvalidCredentials'));
      return;
    }

    setSelectedDemoRole(matchedRole);
    setCredentialError(null);
    await login(redirectTarget, matchedRole);
  };

  const handleDemoRoleSelect = (role: DemoRolePreset) => {
    setSelectedDemoRole(role);
    setCredentials(getDemoCredentials(role));
    setCredentialError(null);
  };

  return (
    <section className="auth-layout">
      <article className={`panel auth-panel auth-panel--form ${demoMode ? 'auth-panel--wide' : ''}`}>
        <span className="sidebar__eyebrow">{t('auth.eyebrow')}</span>
        <h2>{demoMode ? t('auth.quickLoginTitle') : heading}</h2>
        <p className="muted">{demoMode ? t('auth.quickLoginDescription') : description}</p>

        {entryError && !isExpiredSession ? <div className="callout callout--danger">{entryError}</div> : null}

        {demoMode ? (
          <div className="auth-demo-workspace">
            <form className="auth-demo-form" onSubmit={handleDemoCredentialSubmit}>
              <span className="sidebar__eyebrow">{t('auth.demoCredentialsTitle')}</span>
              <div className="auth-demo-form__header">
                <strong>{t('auth.demoCredentialsHeading')}</strong>
                <p className="muted">{t('auth.demoCredentialsDescription')}</p>
              </div>

              <label className="auth-demo-field">
                <span>{t('auth.demoEmailLabel')}</span>
                <input
                  className="input"
                  type="email"
                  autoComplete="username"
                  value={credentials.email}
                  onChange={(event) => setCredentials((current) => ({ ...current, email: event.target.value }))}
                />
              </label>

              <label className="auth-demo-field">
                <span>{t('auth.demoPasswordLabel')}</span>
                <input
                  className="input"
                  type="password"
                  autoComplete="current-password"
                  value={credentials.password}
                  onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
                />
              </label>

              {credentialError ? <div className="callout callout--danger">{credentialError}</div> : null}

              <button className="button button--wide" type="submit">
                {t('auth.enterDemo')}
              </button>

              <div className="auth-demo-form__hint">
                <span>{t('auth.selectedDemoRole')}</span>
                <strong>{t(`demo.role${getDemoRoleTranslationKey(selectedDemoRole)}`)}</strong>
              </div>
            </form>

            <div className="auth-persona-grid">
              {getAvailableDemoRoles().map((role) => {
                const roleKey = getDemoRoleTranslationKey(role);
                const roleLabel = t(`demo.role${roleKey}`);
                const Icon = getRoleIcon(role);

                return (
                  <button
                    key={role}
                    className={`auth-persona-card ${selectedDemoRole === role ? 'auth-persona-card--active' : ''}`}
                    type="button"
                    onClick={() => handleDemoRoleSelect(role)}
                    style={{ '--role-color': `var(--color-role-${getDemoRoleColorToken(role)})` } as any}
                  >
                    <div className="auth-persona-card__icon">
                      <Icon size={24} />
                    </div>
                    <div className="auth-persona-card__body">
                      <strong>{roleLabel}</strong>
                      <p className="muted">{t(`demo.role${roleKey}Desc`)}</p>
                    </div>
                    <div className="auth-persona-card__footer">
                      {t('auth.loginAs', { role: roleLabel })} →
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : entryError && !isExpiredSession ? (
          <div className="actions">
            <button className="button button--wide" type="button" onClick={() => void login(redirectTarget)} disabled={isBusy}>
              {isBusy ? t('auth.redirecting') : t('auth.retryLogin')}
            </button>
          </div>
        ) : (
          <div className="card">
            <span className="card__label">{t('auth.automaticRedirect')}</span>
            <strong>{t('auth.sendingToKeycloak')}</strong>
            <div className="muted">{t('auth.redirectHint')}</div>
          </div>
        )}

        {!demoMode && (
          <div className="auth-metadata">
            <div className="card">
              <span className="card__label">{t('auth.sessionReturn')}</span>
              <strong>{redirectTarget}</strong>
              <div className="muted">{t('auth.sessionReturnDescription')}</div>
            </div>
          </div>
        )}
      </article>
    </section>
  );
}

function readRedirectTarget(state: unknown) {
  const candidate = state as
    | {
        from?: {
          pathname?: string;
          search?: string;
          hash?: string;
        } | string;
      }
    | null;

  if (typeof candidate?.from === 'string') {
    return candidate.from;
  }

  const pathname = candidate?.from?.pathname ?? '/dashboard';
  const search = candidate?.from?.search ?? '';
  const hash = candidate?.from?.hash ?? '';
  return `${pathname}${search}${hash}`;
}

function readEntryError(state: unknown) {
  const candidate = state as { errorMessage?: string } | null;
  return candidate?.errorMessage ?? null;
}

function isExpiredSessionMessage(message: string | null) {
  if (!message) {
    return false;
  }

  const normalized = message.trim().toLowerCase();
  return normalized.includes('session expired') || normalized.includes('sign in again');
}

function getRoleIcon(role: DemoRolePreset) {
  switch (role) {
    case 'admin': return Icons.Settings;
    case 'document_controller': return Icons.Documents;
    case 'manager': return Icons.Approval;
    case 'signer': return Icons.Signature;
    case 'viewer': return Icons.Search;
    default: return Icons.Users;
  }
}
