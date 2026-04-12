import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { ThemeToggle } from '../../../components/ThemeToggle';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';
import { useTranslation } from '../../../i18n/useTranslation';
import { useAuth } from '../../../features/auth/context/useAuth';
import { buildAccessProfile } from '../../auth/authorization';
import { isDemoModeEnabled } from '../../mock/demoMode';

export function AppShell() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const demoMode = isDemoModeEnabled();
  const location = useLocation();
  const [openSection, setOpenSection] = useState<'workspace' | 'actions' | 'admin'>('workspace');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const access = buildAccessProfile(user?.roles ?? []);

  const sections = useMemo(() => {
    const items = [
      {
        key: 'workspace' as const,
        label: t('shell.workspace'),
        links: [
          { to: '/dashboard', label: t('shell.dashboard') },
          { to: '/documents', label: t('shell.documents') },
          { to: '/search', label: t('shell.search') },
        ],
      },
      {
        key: 'actions' as const,
        label: t('shell.actions'),
        links: [
          ...(access.canReviewDocuments ? [{ to: '/approvals', label: t('shell.approvals') }] : []),
          ...(access.canSignDocuments ? [{ to: '/signatures', label: t('shell.signatures') }] : []),
        ],
      },
      {
        key: 'admin' as const,
        label: t('shell.admin'),
        links: [
          ...(access.canAccessUsers ? [{ to: '/users', label: t('shell.users') }] : []),
          ...(access.canAccessUsers ? [{ to: '/users/new', label: t('shell.inviteUser') }] : []),
          ...(access.canAccessPasswordResetAdmin ? [{ to: '/admin/password-reset-requests', label: t('shell.passwordResetRequests') }] : []),
          ...(access.canAccessAuditLogs ? [{ to: '/audit-logs', label: t('shell.auditLogs') }] : []),
        ],
      },
    ];

    return items.filter((section) => section.links.length > 0);
  }, [access.canAccessAuditLogs, access.canAccessPasswordResetAdmin, access.canAccessUsers, access.canReviewDocuments, access.canSignDocuments, t]);

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
            {demoMode ? (
              <NavLink className="topbar__demo-chip" to="/dashboard">
                <span className="topbar__demo-dot" aria-hidden="true" />
                <span>{t('demo.controlTopbar')}</span>
              </NavLink>
            ) : null}
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
                    <span className="muted">{user.email ?? t('shell.noEmail')}</span>
                  </span>
                  <span className="topbar__menu-chevron" aria-hidden="true">{isUserMenuOpen ? '▴' : '▾'}</span>
                </button>
                {isUserMenuOpen ? (
                  <div className="topbar__menu-panel">
                    <NavLink className="topbar__menu-link" to="/me" onClick={() => setIsUserMenuOpen(false)}>
                      {t('shell.myProfile')}
                    </NavLink>
                    <div className="topbar__menu-theme">
                      <span className="topbar__menu-label">{t('language.label')}</span>
                      <LanguageSwitcher variant="menu" />
                    </div>
                    <div className="topbar__menu-theme">
                      <span className="topbar__menu-label">{t('theme.label')}</span>
                      <ThemeToggle variant="menu" />
                    </div>
                    <NavLink className="topbar__menu-link" to="/logout" onClick={() => setIsUserMenuOpen(false)}>
                      {t('shell.logout')}
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
