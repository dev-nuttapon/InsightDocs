import { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';

import { buildAccessProfile } from '../../../shared/auth/authorization';
import { StatePanel } from '../../../shared/components/state/StatePanel';
import { useAuth } from '../context/useAuth';

export function AccessCheckPage() {
  const { isAuthenticated, isLoading, login, error, user } = useAuth();
  const hasStartedLogin = useRef(false);
  const access = buildAccessProfile(user?.roles ?? []);
  const dashboardPath = '/dashboard';

  useEffect(() => {
    if (isLoading || isAuthenticated || hasStartedLogin.current) {
      return;
    }

    hasStartedLogin.current = true;
    void login(dashboardPath);
  }, [dashboardPath, isAuthenticated, isLoading, login]);

  if (isLoading) {
    return (
      <StatePanel
        eyebrow="Authentication"
        title="Checking access"
        description="กำลังตรวจสอบ token, session และสิทธิ์การเข้าใช้งานของคุณ"
        busy
      />
    );
  }

  if (isAuthenticated && access.normalizedRoles.length === 0) {
    return <Navigate replace to="/unauthorized" state={{ errorMessage: 'This account is authenticated but does not have any mapped InsightDocs roles.' }} />;
  }

  if (isAuthenticated) {
    return <Navigate replace to={dashboardPath} />;
  }

  return (
    <StatePanel
      eyebrow="Authentication"
      title="Checking access"
      description={error ?? 'ไม่พบ session ที่ใช้งานได้ กำลังส่งคุณไปยัง Keycloak login'}
      busy
      tone={error ? 'danger' : 'default'}
    />
  );
}
