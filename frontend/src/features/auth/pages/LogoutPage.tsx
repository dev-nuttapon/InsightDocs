import { useEffect } from 'react';

import { StatePanel } from '../../../shared/components/state/StatePanel';
import { useAuth } from '../context/useAuth';
import { useTranslation } from '../../../i18n/useTranslation';

export function LogoutPage() {
  const { logout } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    void logout();
  }, [logout]);

  return (
    <StatePanel
      eyebrow={t('auth.eyebrow')}
      title={t('auth.signingOutTitle')}
      description={t('auth.signingOutDescription')}
      busy
    />
  );
}
