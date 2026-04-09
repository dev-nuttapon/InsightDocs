import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../context/useAuth';
import { resetLoginRedirectFlag } from '../services/oidcClient';

export function LoginPage() {
  const location = useLocation();
  const { isAuthenticated, isLoading, login, error } = useAuth();
  const redirectTarget = readRedirectTarget(location.state);
  const entryError = readEntryError(location.state) ?? error;
  const autoStart = readAutoStart(location.state);

  useEffect(() => {
    resetLoginRedirectFlag();
  }, []);

  useEffect(() => {
    if (isAuthenticated || isLoading || entryError || !autoStart) {
      return;
    }

    const timerId = window.setTimeout(() => {
      void login(redirectTarget);
    }, 500);

    return () => window.clearTimeout(timerId);
  }, [autoStart, entryError, isAuthenticated, isLoading, login, redirectTarget]);

  if (isAuthenticated) {
    return <Navigate replace to={redirectTarget} />;
  }

  return (
    <section className="auth-layout">
      <article className="panel auth-panel auth-panel--form">
        <span className="sidebar__eyebrow">Authentication</span>
        <h2>{entryError ? 'Keycloak sign-in needs attention' : autoStart ? 'Preparing Keycloak login' : 'Ready to sign in'}</h2>
        <p className="muted">
          {entryError
            ? 'The sign-in flow returned with an error. Review the message below, then retry once Keycloak or the backend is ready.'
            : autoStart
              ? 'กำลังส่งคุณไปยังหน้า login ของ Keycloak อัตโนมัติ หลังจากตรวจสอบสิทธิ์การเข้าใช้งานแล้ว'
              : 'InsightDocs uses Keycloak as the login entry page. Register and forgot-password actions are handled from the Keycloak screen, while the actual register and forgot-password pages still live in this project.'}
        </p>

        {entryError ? <div className="callout callout--danger">{entryError}</div> : null}

        {entryError ? (
          <div className="actions">
            <button className="button button--wide" type="button" onClick={() => void login(redirectTarget)} disabled={isLoading}>
              {isLoading ? 'Redirecting...' : 'Retry Keycloak Login'}
            </button>
          </div>
        ) : (
          <div className="card">
            <span className="card__label">{autoStart ? 'Automatic Redirect' : 'Manual Start'}</span>
            <strong>{autoStart ? 'Sending you to Keycloak now' : 'Open Keycloak when you are ready'}</strong>
            <div className="muted">
              {autoStart
                ? 'If nothing happens, check that `auth.localhost` is reachable and reload this page.'
                : 'Use the button below to start the Keycloak login flow.'}
            </div>
          </div>
        )}

        {!entryError && !autoStart ? (
          <div className="actions">
            <button className="button button--wide" type="button" onClick={() => void login(redirectTarget)} disabled={isLoading}>
              {isLoading ? 'Redirecting...' : 'Continue to Keycloak'}
            </button>
          </div>
        ) : null}

        <div className="auth-metadata">
          <div className="card">
            <span className="card__label">Session Return</span>
            <strong>{redirectTarget}</strong>
            <div className="muted">The app will send you back here after the callback completes.</div>
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

  const pathname = candidate?.from?.pathname ?? '/';
  const search = candidate?.from?.search ?? '';
  const hash = candidate?.from?.hash ?? '';
  return `${pathname}${search}${hash}`;
}

function readEntryError(state: unknown) {
  const candidate = state as { errorMessage?: string } | null;
  return candidate?.errorMessage ?? null;
}

function readAutoStart(state: unknown) {
  const candidate = state as { autoStart?: boolean } | null;
  return candidate?.autoStart ?? false;
}
