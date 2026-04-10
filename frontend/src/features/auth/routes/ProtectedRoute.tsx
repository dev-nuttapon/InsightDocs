import { Outlet, Navigate, useLocation } from 'react-router-dom';

import { StatePanel } from '../../../shared/components/state/StatePanel';
import { useAuth } from '../context/useAuth';

export function ProtectedRoute() {
  const location = useLocation();
  const { authState, isAuthenticated, isReady, error } = useAuth();

  if (!isReady) {
    return (
      <StatePanel
        eyebrow="Authentication"
        title="Checking your session"
        description="กำลังตรวจสอบ token, session และโหลดข้อมูลสิทธิ์ของคุณ"
        busy
      />
    );
  }

  if (authState === 'expired') {
    return <Navigate replace to="/login" state={{ from: location, errorMessage: 'Your session expired. Please sign in again.' }} />;
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/login" state={{ from: location, errorMessage: error }} />;
  }

  return <Outlet />;
}
