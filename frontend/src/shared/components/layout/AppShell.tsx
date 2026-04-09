import { NavLink, Outlet } from 'react-router-dom';

import { ThemeToggle } from '../../../components/ThemeToggle';
import { useAuth } from '../../../features/auth/context/useAuth';

const links = [
  { to: '/me', label: 'My Profile' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/documents', label: 'Documents' },
  { to: '/search', label: 'Search' },
];

export function AppShell() {
  const { user, logout, isAuthenticated } = useAuth();
  const isAdmin = user?.roles.some((role) => ['Admin', 'admin', 'realm-admin', 'insightdocs-admin'].includes(role)) ?? false;
  const canReviewDocuments = user?.roles.some((role) => ['Admin', 'Manager', 'admin', 'realm-admin', 'insightdocs-admin'].includes(role)) ?? false;
  const canSignDocuments = user?.roles.some((role) => ['Admin', 'Signer', 'admin', 'realm-admin', 'insightdocs-admin'].includes(role)) ?? false;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="sidebar__eyebrow">Enterprise PDF Platform</span>
          <h1 className="sidebar__title">InsightDocs</h1>
          <p className="sidebar__copy">
            Internal document control, approvals, versioning, and future audit/search services.
          </p>
        </div>

        <nav className="sidebar__nav" aria-label="Primary">
          {links.map((link) => (
            <NavLink
              key={link.to}
              className="sidebar__link"
              to={link.to}
            >
              {link.label}
            </NavLink>
          ))}
          {canReviewDocuments ? (
            <NavLink className="sidebar__link" to="/approvals">
              Approvals
            </NavLink>
          ) : null}
          {canSignDocuments ? (
            <NavLink className="sidebar__link" to="/signatures">
              Signatures
            </NavLink>
          ) : null}
          {isAdmin ? (
            <>
              <NavLink className="sidebar__link" to="/users">
                Users & Roles
              </NavLink>
              <NavLink className="sidebar__link" to="/admin/password-reset-requests">
                Password Reset Requests
              </NavLink>
              <NavLink className="sidebar__link" to="/audit-logs">
                Audit Logs
              </NavLink>
            </>
          ) : null}
        </nav>

        {isAuthenticated && user ? (
          <section className="sidebar__profile">
            <span className="card__label">Signed In</span>
            <strong>{user.username ?? user.email ?? user.subject}</strong>
            <span className="muted">{user.email ?? 'Email not provided'}</span>
            <span className="muted">Roles: {user.roles.length > 0 ? user.roles.join(', ') : 'No roles'}</span>
            <button className="button button--secondary" type="button" onClick={() => void logout()}>
              Logout
            </button>
          </section>
        ) : null}
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <span className="sidebar__eyebrow">Authenticated Workspace</span>
            <h2 className="topbar__title">Document Control Workspace</h2>
          </div>
          <div className="topbar__actions">
            <ThemeToggle />
            {user ? (
              <div className="topbar__profile">
                <strong>{user.username ?? user.subject}</strong>
                <span className="muted">{user.email ?? 'No email claim'}</span>
              </div>
            ) : null}
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
