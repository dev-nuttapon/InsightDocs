import { useEffect } from 'react';

import { useAuth } from '../context/useAuth';

export function LogoutPage() {
  const { logout } = useAuth();

  useEffect(() => {
    void logout();
  }, [logout]);

  return (
    <section className="panel">
      <span className="sidebar__eyebrow">Authentication</span>
      <h2>Signing out</h2>
      <p className="muted">Ending your local session and redirecting to Keycloak logout.</p>
    </section>
  );
}
