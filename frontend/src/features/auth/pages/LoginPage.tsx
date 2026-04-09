import { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { buildAccessProfile, canAccessPath, resolveDefaultAuthorizedPath } from '../../../shared/auth/authorization';
import { useAuth } from '../context/useAuth';
import { resetLoginRedirectFlag } from '../services/oidcClient';

export function LoginPage() {
  const location = useLocation();
  const { authState, isAuthenticated, isReady, login, error, user } = useAuth();
  const redirectTarget = readRedirectTarget(location.state);
  const entryError = readEntryError(location.state) ?? error;
  const loginStartedRef = useRef(false);
  const access = buildAccessProfile(user?.roles ?? []);
  const hasMappedAccess = access.normalizedRoles.length > 0;
  const authorizedTarget = hasMappedAccess && canAccessPath(access, redirectTarget)
    ? redirectTarget
    : resolveDefaultAuthorizedPath(access);

  useEffect(() => {
    resetLoginRedirectFlag();
    loginStartedRef.current = false;
  }, []);

  useEffect(() => {
    if (!isReady || isAuthenticated || entryError || loginStartedRef.current) {
      return;
    }

    loginStartedRef.current = true;
    void login(redirectTarget).catch(() => {
      loginStartedRef.current = false;
    });
  }, [entryError, isAuthenticated, isReady, login, redirectTarget]);

  if (isAuthenticated && !hasMappedAccess) {
    return <Navigate replace to="/unauthorized" state={{ errorMessage: 'This account is authenticated but does not have any mapped InsightDocs roles.' }} />;
  }

  if (isAuthenticated) {
    return <Navigate replace to={authorizedTarget} />;
  }

  const isBusy = !isReady || authState === 'loading';
  const heading = entryError
    ? 'Keycloak sign-in needs attention'
    : authState === 'expired'
      ? 'Session expired'
      : 'Checking your session';
  const description = entryError
    ? 'The sign-in flow returned with an error. Review the message below, then retry once Keycloak or the backend is ready.'
    : authState === 'expired'
      ? 'เซสชันเดิมไม่สามารถใช้งานต่อได้ ระบบจะพาคุณไปเริ่ม login ใหม่ผ่าน Keycloak'
      : 'กำลังตรวจสอบ session ปัจจุบัน และจะส่งคุณไปยังหน้า login ของ Keycloak โดยอัตโนมัติถ้ายังไม่ได้เข้าสู่ระบบ';

  return (
    <section className="auth-layout">
      <article className="panel auth-panel auth-panel--form">
        <span className="sidebar__eyebrow">Authentication</span>
        <h2>{heading}</h2>
        <p className="muted">{description}</p>

        {entryError ? <div className="callout callout--danger">{entryError}</div> : null}

        {entryError ? (
          <div className="actions">
            <button className="button button--wide" type="button" onClick={() => void login(redirectTarget)} disabled={isBusy}>
              {isBusy ? 'Redirecting...' : 'Retry Keycloak Login'}
            </button>
          </div>
        ) : (
          <div className="card">
            <span className="card__label">Automatic Redirect</span>
            <strong>Sending you to Keycloak now</strong>
            <div className="muted">
              If nothing happens, check that `auth.localhost` is reachable and reload this page.
            </div>
          </div>
        )}

        <div className="auth-metadata">
          <div className="card">
            <span className="card__label">Session Return</span>
            <strong>{redirectTarget}</strong>
            <div className="muted">If access to that page is not permitted, the app will send you to the first page allowed by your InsightDocs roles.</div>
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
