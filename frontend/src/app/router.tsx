import { createBrowserRouter } from 'react-router-dom';

import { AppShell } from '../shared/components/layout/AppShell';
import { ApprovalsPage } from '../features/approvals/pages/ApprovalsPage';
import { AccessCheckPage } from '../features/auth/pages/AccessCheckPage';
import { AuthCallbackPage } from '../features/auth/pages/AuthCallbackPage';
import { AdminPasswordResetRequestsPage } from '../features/auth/pages/AdminPasswordResetRequestsPage';
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { LogoutPage } from '../features/auth/pages/LogoutPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage';
import { UnauthorizedPage } from '../features/auth/pages/UnauthorizedPage';
import { ProtectedRoute } from '../features/auth/routes/ProtectedRoute';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { DocumentDetailPage } from '../features/documents/pages/DocumentDetailPage';
import { DocumentsPage } from '../features/documents/pages/DocumentsPage';
import { SearchPage } from '../features/search/pages/SearchPage';
import { SignaturesPage } from '../features/signatures/pages/SignaturesPage';
import { CurrentUserPage } from '../features/users/pages/CurrentUserPage';
import { UserDetailPage } from '../features/users/pages/UserDetailPage';
import { UsersPage } from '../features/users/pages/UsersPage';
import { AdminRoute } from '../features/users/routes/AdminRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AccessCheckPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallbackPage />,
  },
  {
    path: '/logout',
    element: <LogoutPage />,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <AppShell />,
        children: [
          {
            path: 'me',
            element: <CurrentUserPage />,
          },
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
          {
            path: 'documents',
            element: <DocumentsPage />,
          },
          {
            path: 'search',
            element: <SearchPage />,
          },
          {
            path: 'documents/:id',
            element: <DocumentDetailPage />,
          },
          {
            path: 'approvals',
            element: <ApprovalsPage />,
          },
          {
            path: 'signatures',
            element: <SignaturesPage />,
          },
          {
            element: <AdminRoute />,
            children: [
              {
                path: 'users',
                element: <UsersPage />,
              },
              {
                path: 'users/:id',
                element: <UserDetailPage />,
              },
              {
                path: 'admin/password-reset-requests',
                element: <AdminPasswordResetRequestsPage />,
              },
            ],
          },
        ],
      },
    ],
  },
]);
