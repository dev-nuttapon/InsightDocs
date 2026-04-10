import { useEffect } from 'react';

import { StatePanel } from '../../../shared/components/state/StatePanel';
import { useAuth } from '../context/useAuth';

export function LogoutPage() {
  const { logout } = useAuth();

  useEffect(() => {
    void logout();
  }, [logout]);

  return (
    <StatePanel
      eyebrow="Authentication"
      title="Signing out"
      description="Ending your current session and redirecting to Keycloak logout."
      busy
    />
  );
}
