import { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { ThemeToggle } from '../../../components/ThemeToggle';
import { useAuth } from '../../../features/auth/context/useAuth';
import { buildAccessProfile } from '../../auth/authorization';

export function AppShell() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [openSection, setOpenSection] = useState<'workspace' | 'actions' | 'admin'>('workspace');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const access = buildAccessProfile(user?.roles ?? []);
  const pageMeta = useMemo(() => resolvePageMeta(location.pathname), [location.pathname]);
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
              { to: '/users', label: 'Users & Access' },
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
          <div className="sidebar__brand-mark" aria-hidden="true">ID</div>
          <div className="sidebar__brand-copy">
            <span className="sidebar__eyebrow">Enterprise PDF Platform</span>
          </div>
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
                        <span>{link.label}</span>
                        <span className="sidebar__link-arrow" aria-hidden="true">↗</span>
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
            <strong>{user.displayName ?? user.username ?? user.email ?? user.subject}</strong>
            <span className="muted">{user.email ?? 'Email not provided'}</span>
            <NavLink className="button button--secondary" to="/logout">
              Logout
            </NavLink>
          </section>
        ) : null}
      </aside>

      <main className="content">
        <header className="topbar">
          <div className="topbar__context">
            <span className="sidebar__eyebrow">{pageMeta.eyebrow}</span>
            <h2 className="topbar__title">{pageMeta.title}</h2>
            <p className="topbar__copy">{pageMeta.description}</p>
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
        <div className="content__body">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function resolvePageMeta(pathname: string) {
  if (pathname.startsWith('/documents')) {
    return {
      eyebrow: 'Document Control',
      title: 'Document workspace',
      description: 'Track controlled files, version history, metadata quality, and document ownership in one place.',
    };
  }

  if (pathname.startsWith('/approvals')) {
    return {
      eyebrow: 'Approval Queue',
      title: 'Review pending decisions',
      description: 'Open the queue, inspect context quickly, and clear approval work without losing audit traceability.',
    };
  }

  if (pathname.startsWith('/signatures')) {
    return {
      eyebrow: 'Signature Queue',
      title: 'Complete signing steps',
      description: 'See pending signature work, move through sequential sign-off, and keep document execution on track.',
    };
  }

  if (pathname.startsWith('/users') || pathname.startsWith('/admin') || pathname.startsWith('/audit-logs')) {
    return {
      eyebrow: 'Administration',
      title: 'Manage access and oversight',
      description: 'Review Keycloak-backed access, handle privileged requests, and inspect audit history from the admin workspace.',
    };
  }

  if (pathname.startsWith('/search')) {
    return {
      eyebrow: 'Search',
      title: 'Find governed content',
      description: 'Search by metadata and document context to reach the right controlled record faster.',
    };
  }

  if (pathname.startsWith('/me')) {
    return {
      eyebrow: 'Profile',
      title: 'Your current access',
      description: 'Review the identity, roles, and workspace capabilities active in this session.',
    };
  }

  return {
    eyebrow: 'Authenticated Workspace',
    title: 'Document Control Workspace',
    description: 'Operate controlled content, move work through review, and keep every change audit-ready.',
  };
}
