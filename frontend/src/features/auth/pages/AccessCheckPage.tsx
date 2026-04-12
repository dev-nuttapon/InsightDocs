import { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';

import { buildAccessProfile } from '../../../shared/auth/authorization';
import { StatePanel } from '../../../shared/components/state/StatePanel';
import { useAuth } from '../context/useAuth';
import { useTranslation } from '../../../i18n/useTranslation';

export function AccessCheckPage() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading, login, error, user } = useAuth();
  const hasStartedLogin = useRef(false);
  const access = buildAccessProfile(user?.roles ?? []);
  const dashboardPath = '/dashboard';

  useEffect(() => {
    if (isLoading || isAuthenticated || hasStartedLogin.current) {
      return;
    }

    hasStartedLogin.current = true;
    void login(dashboardPath);
  }, [dashboardPath, isAuthenticated, isLoading, login]);

  if (isLoading) {
    return (
      <StatePanel
        eyebrow={t('auth.eyebrow')}
        title={t('auth.checkingAccessTitle')}
        description={t('auth.checkingAccessDescription')}
        busy
      />
    );
  }

  if (isAuthenticated && access.normalizedRoles.length === 0) {
    return <Navigate replace to="/unauthorized" state={{ errorMessage: t('auth.noMappedRoles') }} />;
  }

  if (isAuthenticated) {
    return <Navigate replace to={dashboardPath} />;
  }

  return (
    <StatePanel
      eyebrow={t('auth.eyebrow')}
      title={t('auth.checkingAccessTitle')}
      description={error ?? t('auth.noActiveSession')}
      busy
      tone={error ? 'danger' : 'default'}
    />
  );
}
