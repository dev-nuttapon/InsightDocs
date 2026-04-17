import { Suspense, lazy, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { StatePanel } from '../shared/components/state/StatePanel';
import { ProtectedRoute } from '../features/auth/routes/ProtectedRoute';
import { RoleRoute } from '../shared/routing/RoleRoute';
import { getRouterBasename } from '../shared/routing/appBasePath';

const AppShell = lazy(async () => ({ default: (await import('../shared/components/layout/AppShell')).AppShell }));
const ApprovalsPage = lazy(async () => ({ default: (await import('../features/approvals/pages/ApprovalsPage')).ApprovalsPage }));
const AuditLogsPage = lazy(async () => ({ default: (await import('../features/audit/pages/AuditLogsPage')).AuditLogsPage }));
const AuthCallbackPage = lazy(async () => ({ default: (await import('../features/auth/pages/AuthCallbackPage')).AuthCallbackPage }));
const AdminPasswordResetRequestsPage = lazy(async () => ({ default: (await import('../features/auth/pages/AdminPasswordResetRequestsPage')).AdminPasswordResetRequestsPage }));
const AccessCheckPage = lazy(async () => ({ default: (await import('../features/auth/pages/AccessCheckPage')).AccessCheckPage }));
const ForgotPasswordPage = lazy(async () => ({ default: (await import('../features/auth/pages/ForgotPasswordPage')).ForgotPasswordPage }));
const LoginPage = lazy(async () => ({ default: (await import('../features/auth/pages/LoginPage')).LoginPage }));
const LogoutPage = lazy(async () => ({ default: (await import('../features/auth/pages/LogoutPage')).LogoutPage }));
const RegisterPage = lazy(async () => ({ default: (await import('../features/auth/pages/RegisterPage')).RegisterPage }));
const ResetPasswordPage = lazy(async () => ({ default: (await import('../features/auth/pages/ResetPasswordPage')).ResetPasswordPage }));
const UnauthorizedPage = lazy(async () => ({ default: (await import('../features/auth/pages/UnauthorizedPage')).UnauthorizedPage }));
const DashboardPage = lazy(async () => ({ default: (await import('../features/dashboard/pages/DashboardPage')).DashboardPage }));
const DocumentDetailPage = lazy(async () => ({ default: (await import('../features/documents/pages/DocumentDetailPage')).DocumentDetailPage }));
const DocumentsPage = lazy(async () => ({ default: (await import('../features/documents/pages/DocumentsPage')).DocumentsPage }));
const ImpactBenefitPage = lazy(async () => ({ default: (await import('../features/impact/pages/ImpactBenefitPage')).ImpactBenefitPage }));
const SearchPage = lazy(async () => ({ default: (await import('../features/search/pages/SearchPage')).SearchPage }));
const SignaturesPage = lazy(async () => ({ default: (await import('../features/signatures/pages/SignaturesPage')).SignaturesPage }));
const CurrentUserPage = lazy(async () => ({ default: (await import('../features/users/pages/CurrentUserPage')).CurrentUserPage }));
const CreateUserPage = lazy(async () => ({ default: (await import('../features/users/pages/CreateUserPage')).CreateUserPage }));
const EditUserPage = lazy(async () => ({ default: (await import('../features/users/pages/EditUserPage')).EditUserPage }));
const UsersPage = lazy(async () => ({ default: (await import('../features/users/pages/UsersPage')).UsersPage }));

function withPageLoader(node: ReactNode) {
  return (
    <Suspense fallback={<StatePanel eyebrow="Loading" title="Opening workspace" description="Preparing the next InsightDocs screen." busy />}>
      {node}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: withPageLoader(<AccessCheckPage />),
  },
  {
    path: '/login',
    element: withPageLoader(<LoginPage />),
  },
  {
    path: '/register',
    element: withPageLoader(<RegisterPage />),
  },
  {
    path: '/forgot-password',
    element: withPageLoader(<ForgotPasswordPage />),
  },
  {
    path: '/reset-password',
    element: withPageLoader(<ResetPasswordPage />),
  },
  {
    path: '/auth/callback',
    element: withPageLoader(<AuthCallbackPage />),
  },
  {
    path: '/logout',
    element: withPageLoader(<LogoutPage />),
  },
  {
    path: '/unauthorized',
    element: withPageLoader(<UnauthorizedPage />),
  },
  {
    path: '/impact-benefit',
    element: withPageLoader(<ImpactBenefitPage />),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: withPageLoader(<AppShell />),
        children: [
          {
            path: 'me',
            element: withPageLoader(<CurrentUserPage />),
          },
          {
            path: 'dashboard',
            element: withPageLoader(<DashboardPage />),
          },
          {
            path: 'documents',
            element: withPageLoader(<DocumentsPage />),
          },
          {
            path: 'search',
            element: withPageLoader(<SearchPage />),
          },
          {
            path: 'documents/:id',
            element: withPageLoader(<DocumentDetailPage />),
          },
          {
            path: 'approvals',
            element: <RoleRoute check={(access) => access.canReviewDocuments} />,
            children: [
              {
                index: true,
                element: withPageLoader(<ApprovalsPage />),
              },
            ],
          },
          {
            path: 'signatures',
            element: <RoleRoute check={(access) => access.canSignDocuments} />,
            children: [
              {
                index: true,
                element: withPageLoader(<SignaturesPage />),
              },
            ],
          },
          {
            element: <RoleRoute check={(access) => access.canAccessUsers} />,
            children: [
              {
                path: 'users',
                element: withPageLoader(<UsersPage />),
              },
              {
                path: 'users/new',
                element: withPageLoader(<CreateUserPage />),
              },
              {
                path: 'users/:id/edit',
                element: withPageLoader(<EditUserPage />),
              },
            ],
          },
          {
            element: <RoleRoute check={(access) => access.canAccessPasswordResetAdmin} />,
            children: [
              {
                path: 'admin/password-reset-requests',
                element: withPageLoader(<AdminPasswordResetRequestsPage />),
              },
            ],
          },
          {
            element: <RoleRoute check={(access) => access.canAccessAuditLogs} />,
            children: [
              {
                path: 'audit-logs',
                element: withPageLoader(<AuditLogsPage />),
              },
            ],
          },
        ],
      },
    ],
  },
], {
  basename: getRouterBasename(),
});
