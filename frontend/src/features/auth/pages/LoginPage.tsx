import { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { buildAccessProfile, canAccessPath, resolveDefaultAuthorizedPath } from '../../../shared/auth/authorization';
import { useAuth } from '../context/useAuth';
import { useTranslation } from '../../../i18n/useTranslation';

export function LoginPage() {
  const location = useLocation();
  const { t } = useTranslation();
  const { authState, isAuthenticated, isReady, login, error, user } = useAuth();
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
    if (!isReady || isAuthenticated || loginStartedRef.current || (entryError && !isExpiredSession)) {
      return;
    }

    loginStartedRef.current = true;
    void login(redirectTarget).catch(() => {
      loginStartedRef.current = false;
    });
  }, [entryError, isAuthenticated, isExpiredSession, isReady, login, redirectTarget]);

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

  return (
    <section className="auth-layout">
      <article className="panel auth-panel auth-panel--form">
        <span className="sidebar__eyebrow">{t('auth.eyebrow')}</span>
        <h2>{heading}</h2>
        <p className="muted">{description}</p>

        {entryError && !isExpiredSession ? <div className="callout callout--danger">{entryError}</div> : null}

        {entryError && !isExpiredSession ? (
          <div className="actions">
            <button className="button button--wide" type="button" onClick={() => void login(redirectTarget)} disabled={isBusy}>
              {isBusy ? t('auth.redirecting') : t('auth.retryLogin')}
            </button>
          </div>
        ) : (
          <div className="card">
            <span className="card__label">{t('auth.automaticRedirect')}</span>
            <strong>{t('auth.sendingToKeycloak')}</strong>
            <div className="muted">
              {t('auth.redirectHint')}
            </div>
          </div>
        )}

        <div className="auth-metadata">
          <div className="card">
            <span className="card__label">{t('auth.sessionReturn')}</span>
            <strong>{redirectTarget}</strong>
            <div className="muted">{t('auth.sessionReturnDescription')}</div>
          </div>
        </div>
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
