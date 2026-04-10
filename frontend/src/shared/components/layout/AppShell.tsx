import { useMemo, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

import { ThemeToggle } from '../../../components/ThemeToggle';
import { useAuth } from '../../../features/auth/context/useAuth';
import { buildAccessProfile, formatRoleLabel } from '../../auth/authorization';

export function AppShell() {
  const { user, isAuthenticated } = useAuth();
  const [openSection, setOpenSection] = useState<'workspace' | 'actions' | 'admin'>('workspace');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const access = buildAccessProfile(user?.roles ?? []);
  const sections = useMemo(() => {
    const items = [
      {
        key: 'workspace' as const,
        label: 'Workspace',
        links: [
          { to: '/dashboard', label: 'Dashboard' },
          { to: '/documents', label: 'Documents' },
          { to: '/search', label: 'Search' },
        ],
      },
      {
        key: 'actions' as const,
        label: 'My Actions',
        links: [
          { to: '/me', label: 'My Profile' },
          ...(access.canReviewDocuments ? [{ to: '/approvals', label: 'Approvals' }] : []),
          ...(access.canSignDocuments ? [{ to: '/signatures', label: 'Signatures' }] : []),
        ],
      },
      {
        key: 'admin' as const,
        label: 'Administration',
        links: access.canAccessAdmin
          ? [
              { to: '/users', label: 'Users & Roles' },
              { to: '/admin/password-reset-requests', label: 'Password Reset Requests' },
              { to: '/audit-logs', label: 'Audit Logs' },
            ]
          : [],
      },
    ];

    return items.filter((section) => section.links.length > 0);
  }, [access.canAccessAdmin, access.canReviewDocuments, access.canSignDocuments]);

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
          {sections.map((section) => {
            const isOpen = openSection === section.key;

            return (
              <section key={section.key} className="sidebar__group">
                <button
                  className={`sidebar__group-toggle${isOpen ? ' active' : ''}`}
                  type="button"
                  onClick={() => setOpenSection(isOpen ? section.key : section.key)}
                >
                  <span>{section.label}</span>
                  <span className="sidebar__group-icon" aria-hidden="true">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen ? (
                  <div className="sidebar__group-links">
                    {section.links.map((link) => (
                      <NavLink
                        key={link.to}
                        className="sidebar__link"
                        to={link.to}
                      >
                        {link.label}
                      </NavLink>
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}
        </nav>

        {isAuthenticated && user ? (
          <section className="sidebar__profile">
            <span className="card__label">Signed In</span>
            <strong>{user.username ?? user.email ?? user.subject}</strong>
            <span className="muted">{user.email ?? 'Email not provided'}</span>
            <span className="muted">
              Roles: {access.normalizedRoles.length > 0 ? access.normalizedRoles.map(formatRoleLabel).join(', ') : 'No roles'}
            </span>
            <NavLink className="button button--secondary" to="/logout">
              Logout
            </NavLink>
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
            {user ? (
              <div className="topbar__menu">
                <button
                  className={`topbar__profile-button${isUserMenuOpen ? ' active' : ''}`}
                  type="button"
                  onClick={() => setIsUserMenuOpen((value) => !value)}
                >
                  <span className="topbar__profile-copy">
                    <strong>{user.username ?? user.subject}</strong>
                    <span className="muted">{user.email ?? 'No email claim'}</span>
                  </span>
                  <span aria-hidden="true">{isUserMenuOpen ? '▴' : '▾'}</span>
                </button>
                {isUserMenuOpen ? (
                  <div className="topbar__menu-panel">
                    <NavLink className="topbar__menu-link" to="/me" onClick={() => setIsUserMenuOpen(false)}>
                      My Profile
                    </NavLink>
                    <div className="topbar__menu-theme">
                      <span className="topbar__menu-label">Theme</span>
                      <ThemeToggle variant="menu" />
                    </div>
                    <NavLink className="topbar__menu-link" to="/logout" onClick={() => setIsUserMenuOpen(false)}>
                      Logout
                    </NavLink>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
