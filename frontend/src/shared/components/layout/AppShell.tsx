import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { ThemeToggle } from '../../../components/ThemeToggle';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';
import { useTranslation } from '../../../i18n/useTranslation';
import { useAuth } from '../../../features/auth/context/useAuth';
import { buildAccessProfile } from '../../auth/authorization';
import { isDemoModeEnabled } from '../../mock/demoMode';
import { Icons } from '../ui/Icons';
import { resetDemoScenario } from '../../mock/demoScenario';
import { toAppPath } from '../../routing/appBasePath';
import {
  getAvailableDemoRoles,
  getDemoRoleColorToken,
  getDemoRoleTranslationKey,
  DemoRolePreset,
} from '../../mock/demoAuth';

export function AppShell() {
  const { user, demoRole, setDemoRole } = useAuth();
  const { t } = useTranslation();
  const demoMode = isDemoModeEnabled();
  const location = useLocation();
  const [openSection, setOpenSection] = useState<'workspace' | 'actions' | 'admin'>('workspace');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDemoMenuOpen, setIsDemoMenuOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const access = buildAccessProfile(user?.roles ?? []);

  const sections = useMemo(() => {
    const items = [
      {
        key: 'workspace' as const,
        label: t('shell.workspace'),
        links: [
          { to: '/dashboard', label: t('shell.dashboard'), icon: Icons.Dashboard },
          { to: '/documents', label: t('shell.documents'), icon: Icons.Documents },
          { to: '/search', label: t('shell.search'), icon: Icons.Search },
          { to: '/impact-benefit', label: t('shell.impactBenefit'), icon: Icons.Audit },
        ],
      },
      {
        key: 'actions' as const,
        label: t('shell.actions'),
        links: [
          ...(access.canReviewDocuments ? [{ to: '/approvals', label: t('shell.approvals'), icon: Icons.Approval }] : []),
          ...(access.canSignDocuments ? [{ to: '/signatures', label: t('shell.signatures'), icon: Icons.Signature }] : []),
        ],
      },
      {
        key: 'admin' as const,
        label: t('shell.admin'),
        links: [
          ...(access.canAccessUsers ? [{ to: '/users', label: t('shell.users'), icon: Icons.Users }] : []),
          ...(access.canAccessUsers ? [{ to: '/users/new', label: t('shell.inviteUser'), icon: Icons.Plus }] : []),
          ...(access.canAccessPasswordResetAdmin ? [{ to: '/admin/password-reset-requests', label: t('shell.passwordResetRequests'), icon: Icons.Settings }] : []),
          ...(access.canAccessAuditLogs ? [{ to: '/audit-logs', label: t('shell.auditLogs'), icon: Icons.Audit }] : []),
        ],
      },

    ];

    return items.filter((section) => section.links.length > 0);
  }, [access.canAccessAuditLogs, access.canAccessPasswordResetAdmin, access.canAccessUsers, access.canReviewDocuments, access.canSignDocuments, t]);

  useEffect(() => {
    setOpenSection(resolveOpenSection(location.pathname));
    setIsMobileMenuOpen(false);
    setIsDemoMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  const handleRoleSwitch = (role: DemoRolePreset) => {
    if (role === demoRole) return;
    
    setIsSwitching(true);
    setDemoRole(role);
    setIsDemoMenuOpen(false);
    
    setTimeout(() => {
      setIsSwitching(false);
    }, 800);
  };

  const getRoleIcon = (role: DemoRolePreset) => {
    switch (role) {
      case 'admin': return Icons.Settings;
      case 'document_controller': return Icons.Documents;
      case 'manager': return Icons.Approval;
      case 'signer': return Icons.Signature;
      case 'viewer': return Icons.Search;
      default: return Icons.Users;
    }
  };

  const demoRoles = getAvailableDemoRoles();
  const currentRole = demoRole ?? 'admin';
  const currentRoleColorToken = getDemoRoleColorToken(currentRole);

  return (
    <div 
      className="app-shell"
      style={{ 
        '--role-color': `var(--color-role-${currentRoleColorToken})`,
        '--role-color-soft': `color-mix(in srgb, var(--color-role-${currentRoleColorToken}) 12%, transparent)`,
        '--role-color-border': `color-mix(in srgb, var(--color-role-${currentRoleColorToken}) 24%, transparent)`,
        '--role-color-text': `var(--color-role-${currentRoleColorToken})`,
      } as any}
    >
      <div 
        className={`sidebar-overlay ${isMobileMenuOpen ? 'sidebar-overlay--active' : ''}`} 
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <aside className={`sidebar ${isMobileMenuOpen ? 'sidebar--open' : ''}`}>
        <NavLink to="/dashboard" className="sidebar__brand">
          <div className="sidebar__brand-mark" aria-hidden="true">ID</div>
          <div className="sidebar__brand-copy">
            <span className="sidebar__brand-name">InsightDocs</span>
          </div>
          <button 
            className="mobile-only sidebar__close-button"
            onClick={(e) => {
              e.preventDefault();
              setIsMobileMenuOpen(false);
            }}
          >
            ×
          </button>
        </NavLink>

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
                          <div className="sidebar__link-content">
                            {link.icon && <link.icon size={18} className="sidebar__link-icon" />}
                            <span>{link.label}</span>
                          </div>
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
              <div className="topbar__demo-group">
                <div className="topbar__menu">
                  <div className="topbar__demo-triggers">
                    <button 
                      className={`topbar__demo-chip${isDemoMenuOpen ? ' active' : ''}`}
                      type="button"
                      onClick={() => setIsDemoMenuOpen(!isDemoMenuOpen)}
                    >
                      <span className="topbar__demo-dot" aria-hidden="true" />
                      <span>{t('demo.controlTopbar')}</span>
                    </button>
                    <button 
                      className={`topbar__role-indicator${isDemoMenuOpen ? ' active' : ''}`} 
                      style={{ 
                        borderColor: 'var(--role-color-border)', 
                        backgroundColor: 'var(--role-color-soft)', 
                        color: 'var(--role-color-text)' 
                      }}
                      onClick={() => setIsDemoMenuOpen(!isDemoMenuOpen)}
                    >
                      <span className="role-dot" style={{ backgroundColor: 'var(--role-color)' }} />
                      {t(`demo.role${getDemoRoleTranslationKey(currentRole)}`)}
                      <span className="topbar__menu-chevron" aria-hidden="true" style={{ marginLeft: '8px', opacity: 0.6 }}>{isDemoMenuOpen ? '▴' : '▾'}</span>
                    </button>
                  </div>
                  {isDemoMenuOpen ? (
                    <div className="topbar__menu-panel topbar__menu-panel--leading topbar__menu-panel--mega">
                      <div className="topbar__mega-grid">
                        <section className="topbar__mega-section">
                          <div className="topbar__menu-header">
                            <span className="sidebar__eyebrow">{t('demo.controlJourneyEyebrow')}</span>
                            <strong>{t('demo.controlTitle')}</strong>
                          </div>
                          <NavLink className="topbar__menu-link" to="/dashboard" onClick={() => setIsDemoMenuOpen(false)}>
                            <div className="topbar__menu-link-content">
                              <Icons.Dashboard size={18} />
                              <span>{t('shell.dashboard')}</span>
                            </div>
                          </NavLink>
                          <NavLink className="topbar__menu-link" to="/documents" onClick={() => setIsDemoMenuOpen(false)}>
                            <div className="topbar__menu-link-content">
                              <Icons.Documents size={18} />
                              <span>{t('demo.controlRegistryTitle')}</span>
                            </div>
                          </NavLink>
                          <div className="topbar__menu-divider" />
                          <button 
                            className="topbar__menu-link topbar__menu-link--danger" 
                            type="button"
                            onClick={() => {
                              resetDemoScenario();
                              window.location.assign(toAppPath('/dashboard'));
                            }}
                          >
                            <div className="topbar__menu-link-content">
                              <Icons.Audit size={18} />
                              <span>{t('demo.controlReset')}</span>
                            </div>
                          </button>
                        </section>

                        <section className="topbar__mega-section topbar__mega-section--alt">
                          <div className="topbar__menu-header">
                            <span className="sidebar__eyebrow">{t('demo.controlRoleEyebrow')}</span>
                            <strong>{t('demo.controlRoleTitle')}</strong>
                          </div>
                          <div className="topbar__persona-list">
                            {demoRoles.map((role) => {
                              const isActive = demoRole === role;
                              const Icon = getRoleIcon(role);
                              const roleKey = getDemoRoleTranslationKey(role);
                              return (
                                <button
                                  key={role}
                                  className={`topbar__persona-item ${isActive ? 'active' : ''}`}
                                  onClick={() => handleRoleSwitch(role)}
                                  style={{ '--role-color-local': `var(--color-role-${getDemoRoleColorToken(role)})` } as any}
                                >
                                  <div className="topbar__persona-icon">
                                    <Icon size={18} />
                                  </div>
                                  <div className="topbar__persona-copy">
                                    <strong>{t(`demo.role${roleKey}`)}</strong>
                                    <span className="muted">{t(`demo.role${roleKey}Desc`)}</span>
                                  </div>
                                  {isActive && <span className="topbar__persona-check">✓</span>}
                                </button>
                              );
                            })}
                          </div>
                        </section>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
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
                    <div className="topbar__menu-preferences">
                      <div className="topbar__menu-control">
                        <span className="topbar__menu-label">{t('language.label')}</span>
                        <LanguageSwitcher variant="menu" />
                      </div>
                      <div className="topbar__menu-control">
                        <span className="topbar__menu-label">{t('theme.label')}</span>
                        <ThemeToggle variant="menu" />
                      </div>
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

      {isSwitching && (
        <div className="demo-switcher__overlay">
          <div className="demo-switcher__overlay-content">
            <div className="spinner" />
            <p>{t('demo.personaSwitching')}</p>
            <strong>{t(`demo.role${getDemoRoleTranslationKey(currentRole)}`)}</strong>
          </div>
        </div>
      )}
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
