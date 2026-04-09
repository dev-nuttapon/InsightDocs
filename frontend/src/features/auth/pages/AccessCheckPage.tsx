import { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';

import { StatePanel } from '../../../shared/components/state/StatePanel';
import { useAuth } from '../context/useAuth';

export function AccessCheckPage() {
  const { isAuthenticated, isLoading, login, error } = useAuth();
  const hasStartedLogin = useRef(false);

  useEffect(() => {
    if (isLoading || isAuthenticated || hasStartedLogin.current) {
      return;
    }

    hasStartedLogin.current = true;
    void login('/dashboard');
  }, [isAuthenticated, isLoading, login]);

  if (isLoading) {
    return <StatePanel eyebrow="Authentication" title="Checking access" description="กำลังตรวจสอบ session และสิทธิ์การเข้าใช้งานของคุณ" />;
  }

  if (isAuthenticated) {
    return <Navigate replace to="/dashboard" />;
  }

  return (
    <StatePanel
      eyebrow="Authentication"
      title="Checking access"
      description={error ?? 'ไม่พบ session ที่ใช้งานได้ กำลังส่งคุณไปยัง Keycloak login'}
      tone={error ? 'danger' : 'default'}
    />
  );
}
