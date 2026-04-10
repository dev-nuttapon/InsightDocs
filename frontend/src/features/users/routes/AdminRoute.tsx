import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../../auth/context/useAuth';
import { buildAccessProfile } from '../../../shared/auth/authorization';

export function AdminRoute() {
  const { user } = useAuth();
  const canAccessAdmin = buildAccessProfile(user?.roles ?? []).canAccessAdmin;

  if (!canAccessAdmin) {
    return <Navigate replace to="/unauthorized" />;
  }

  return <Outlet />;
}
