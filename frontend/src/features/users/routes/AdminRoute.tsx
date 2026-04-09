import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../../auth/context/useAuth';

const adminRoles = new Set(['Admin', 'admin', 'realm-admin', 'insightdocs-admin']);

export function AdminRoute() {
  const { user } = useAuth();

  const isAdmin = user?.roles.some((role) => adminRoles.has(role)) ?? false;

  if (!isAdmin) {
    return <Navigate replace to="/unauthorized" />;
  }

  return <Outlet />;
}
