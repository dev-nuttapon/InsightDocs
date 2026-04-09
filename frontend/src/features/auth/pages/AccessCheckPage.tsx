import { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '../context/useAuth';

export function AccessCheckPage() {
  const { isAuthenticated, isLoading, login, error } = useAuth();
  const hasStartedLogin = useRef(false);

  useEffect(() => {
    if (isLoading || isAuthenticated || hasStartedLogin.current) {
      return;
    }

    hasStartedLogin.current = true;
    void login('/me');
  }, [isAuthenticated, isLoading, login]);

  if (isLoading) {
    return (
      <section className="panel">
        <span className="sidebar__eyebrow">Authentication</span>
        <h2>Checking access</h2>
        <p className="muted">กำลังตรวจสอบ session และสิทธิ์การเข้าใช้งานของคุณ</p>
      </section>
    );
  }

  if (isAuthenticated) {
    return <Navigate replace to="/me" />;
  }

  return (
    <section className="panel">
      <span className="sidebar__eyebrow">Authentication</span>
      <h2>Checking access</h2>
      <p className="muted">ไม่พบ session ที่ใช้งานได้ กำลังส่งคุณไปยัง Keycloak login</p>
      {error ? <div className="callout callout--danger">{error}</div> : null}
    </section>
  );
}
