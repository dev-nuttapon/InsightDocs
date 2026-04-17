import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { StatePanel } from '../../../shared/components/state/StatePanel';
import { useAuth } from '../context/useAuth';
import { useTranslation } from '../../../i18n/useTranslation';

export function LogoutPage() {
  const { isDemoSession, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const logoutStartedRef = useRef(false);

  useEffect(() => {
    if (logoutStartedRef.current) {
      return;
    }

    logoutStartedRef.current = true;

    const fallbackTimeoutId = window.setTimeout(() => {
      navigate('/login', { replace: true });
    }, isDemoSession ? 800 : 4000);

    void logout()
      .catch((error) => {
        console.error('Logout failed:', error);
      })
      .finally(() => {
        window.clearTimeout(fallbackTimeoutId);
        navigate('/login', { replace: true });
      });

    return () => {
      window.clearTimeout(fallbackTimeoutId);
    };
  }, [isDemoSession, logout, navigate]);

  return (
    <StatePanel
      eyebrow={t('auth.eyebrow')}
      title={t('auth.signingOutTitle')}
      description={t('auth.signingOutDescription')}
      busy
    />
  );
}
