import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { StatePanel } from '../../../shared/components/state/StatePanel';
import { useAuth } from '../context/useAuth';
import { useTranslation } from '../../../i18n/useTranslation';

export function LogoutPage() {
  const { logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    void logout().finally(() => {
      navigate('/login', { replace: true });
    });
  }, [logout, navigate]);

  return (
    <StatePanel
      eyebrow={t('auth.eyebrow')}
      title={t('auth.signingOutTitle')}
      description={t('auth.signingOutDescription')}
      busy
    />
  );
}
