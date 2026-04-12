import { Outlet, Navigate, useLocation } from 'react-router-dom';

import { StatePanel } from '../../../shared/components/state/StatePanel';
import { useAuth } from '../context/useAuth';
import { useTranslation } from '../../../i18n/useTranslation';

export function ProtectedRoute() {
  const location = useLocation();
  const { t } = useTranslation();
  const { authState, isAuthenticated, isReady, error } = useAuth();

  if (!isReady) {
    return (
      <StatePanel
        eyebrow={t('auth.eyebrow')}
        title={t('auth.checkingSessionTitle')}
        description={t('auth.checkingSessionGuardDescription')}
        busy
      />
    );
  }

  if (authState === 'expired') {
    return <Navigate replace to="/login" state={{ from: location, errorMessage: t('auth.expiredSessionMessage') }} />;
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/login" state={{ from: location, errorMessage: error }} />;
  }

  return <Outlet />;
}
