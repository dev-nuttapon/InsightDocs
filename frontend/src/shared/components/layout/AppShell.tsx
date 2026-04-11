import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { ThemeToggle } from '../../../components/ThemeToggle';
import { useAuth } from '../../../features/auth/context/useAuth';
import { buildAccessProfile } from '../../auth/authorization';

export function AppShell() {
  const { user } = useAuth();
  const location = useLocation();
  const [openSection, setOpenSection] = useState<'workspace' | 'actions' | 'admin'>('workspace');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
          ...(access.canReviewDocuments ? [{ to: '/approvals', label: 'Approvals' }] : []),
          ...(access.canSignDocuments ? [{ to: '/signatures', label: 'Signatures' }] : []),
        ],
      },
      {
        key: 'admin' as const,
        label: 'Administration',
        links: [
          ...(access.canAccessUsers ? [{ to: '/users', label: 'Users & Access' }] : []),
          ...(access.canAccessUsers ? [{ to: '/users/new', label: 'Invite User' }] : []),
          ...(access.canAccessPasswordResetAdmin ? [{ to: '/admin/password-reset-requests', label: 'Password Reset Requests' }] : []),
          ...(access.canAccessAuditLogs ? [{ to: '/audit-logs', label: 'Audit Logs' }] : []),
        ],
      },
    ];

    return items.filter((section) => section.links.length > 0);
  }, [access.canAccessAuditLogs, access.canAccessPasswordResetAdmin, access.canAccessUsers, access.canReviewDocuments, access.canSignDocuments]);

  useEffect(() => {
    setOpenSection(resolveOpenSection(location.pathname));
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <div 
        className={`sidebar-overlay ${isMobileMenuOpen ? 'sidebar-overlay--active' : ''}`} 
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <aside className={`sidebar ${isMobileMenuOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <div className="sidebar__brand-mark" aria-hidden="true">ID</div>
          <div className="sidebar__brand-copy">
            <span className="sidebar__brand-name">InsightDocs</span>
          </div>
          <button 
            className="mobile-only sidebar__close-button"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="sidebar__scroll-area">
          <nav className="sidebar__nav sidebar__nav--spaced" aria-label="Primary">
            {sections.map((section) => {
              const isOpen = openSection === section.key;

              return (
                <section key={section.key} className="sidebar__group">
                  <button
                    className={`sidebar__group-toggle${isOpen ? ' active' : ''}`}
                    type="button"
                    onClick={() => setOpenSection(section.key)}
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
                          end
                        >
                          <span>{link.label}</span>
                          <span className="sidebar__link-arrow" aria-hidden="true">→</span>
                        </NavLink>
                      ))}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </nav>
        </div>

      </aside>

      <main className="content">
        <header className="topbar">
          <div className="topbar__leading">
            <button 
              className="mobile-only button button--secondary topbar__mobile-trigger"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              ☰
            </button>
          </div>
          <div className="topbar__actions">
            {user ? (
              <div className="topbar__menu">
                <button
                  className={`topbar__profile-button${isUserMenuOpen ? ' active' : ''}`}
                  type="button"
                  onClick={() => setIsUserMenuOpen((value) => !value)}
                >
                  <span className="topbar__avatar" aria-hidden="true">
                    {(user.displayName ?? user.username ?? user.email ?? 'ID').slice(0, 2).toUpperCase()}
                  </span>
                  <span className="topbar__profile-copy">
                    <strong>{user.displayName ?? user.username ?? user.subject}</strong>
                    <span className="muted">{user.email ?? 'No email claim'}</span>
                  </span>
                  <span className="topbar__menu-chevron" aria-hidden="true">{isUserMenuOpen ? '▴' : '▾'}</span>
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
        <div className="content__body">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function resolveOpenSection(pathname: string): 'workspace' | 'actions' | 'admin' {
  if (
    pathname.startsWith('/users') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/audit-logs')
  ) {
    return 'admin';
  }

  if (
    pathname.startsWith('/me') ||
    pathname.startsWith('/approvals') ||
    pathname.startsWith('/signatures')
  ) {
    return 'actions';
  }

  return 'workspace';
}
