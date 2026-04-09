import { Outlet, Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../context/useAuth';

export function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, isLoading, error } = useAuth();

  if (isLoading) {
    return (
      <section className="panel">
        <span className="sidebar__eyebrow">Authentication</span>
        <h2>Checking your session</h2>
        <p className="muted">Validating stored tokens and loading your profile.</p>
      </section>
    );
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/login" state={{ from: location, errorMessage: error, autoStart: true }} />;
  }

  return <Outlet />;
}
