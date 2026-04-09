import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../../features/auth/context/useAuth';
import { buildAccessProfile } from '../auth/authorization';

type RoleRouteProps = {
  check: (access: ReturnType<typeof buildAccessProfile>) => boolean;
};

export function RoleRoute({ check }: RoleRouteProps) {
  const { user } = useAuth();
  const access = buildAccessProfile(user?.roles ?? []);

  if (!check(access)) {
    return <Navigate replace to="/unauthorized" />;
  }

  return <Outlet />;
}
