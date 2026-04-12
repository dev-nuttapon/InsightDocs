import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { changePassword } from '../../auth/api/authApi';
import { getUserProfile } from '../../auth/services/keycloakAuth';
import { useAuth } from '../../auth/context/useAuth';
import { buildAccessProfile, formatRoleLabel } from '../../../shared/auth/authorization';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { ErrorModal } from '../../../shared/components/state/ErrorModal';
import { FeatureHeroPanel } from '../../../shared/components/mock/FeatureHeroPanel';
import { useTranslation } from '../../../i18n/useTranslation';

export function CurrentUserPage() {
  const { accessToken, user } = useAuth();
  const { language, t } = useTranslation();
  const [profile, setProfile] = useState<{ firstName?: string; lastName?: string; username?: string; email?: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const roles = user?.roles ?? [];
  const access = buildAccessProfile(roles);

  const initials = (user?.displayName ?? user?.username ?? user?.email ?? 'ID')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      try {
        const payload = await getUserProfile();
        if (!ignore) {
          setProfile(payload);
        }
      } catch {
        if (!ignore) {
          setProfile(null);
        }
      }
    }

    void loadProfile();

    return () => {
      ignore = true;
    };
  }, []);

  const derivedName = useMemo(() => splitDisplayName(user?.displayName), [user?.displayName]);
  const firstName = profile?.firstName?.trim() || derivedName.firstName || '-';
  const lastName = profile?.lastName?.trim() || derivedName.lastName || '-';
  const normalizedRoles = access.normalizedRoles;

  async function handleChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken) {
      setError(t('profile.noSession'));
      return;
    }

    if (newPassword.trim().length < 8) {
      setError(t('profile.passwordMin'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('profile.passwordMismatch'));
      return;
    }

    try {
      setIsSavingPassword(true);
      setError(null);
      await changePassword(newPassword, accessToken);
      setNotice(t('profile.passwordChanged'));
      setNewPassword('');
      setConfirmPassword('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('profile.passwordChangeFailed'));
      setNotice(null);
    } finally {
      setIsSavingPassword(false);
    }
  }

  return (
    <div className="stack stack--xl">
      <PageHeader
        title={t('profile.title')}
        eyebrow={t('profile.eyebrow')}
        description={t('profile.description')}
      />

      <FeatureHeroPanel
        eyebrow={t('profile.workspaceEyebrow')}
        title={t('profile.workspaceTitle')}
        description={t('profile.workspaceDescription')}
        actions={[
          { label: t('profile.signOut'), to: '/logout', tone: 'secondary' },
        ]}
        stats={[
          {
            label: t('profile.identityTitle'),
            value: profile?.username ?? user?.username ?? '-',
            detail: t('profile.workspaceIdentityDetail'),
          },
          {
            label: t('profile.rolesTitle'),
            value: normalizedRoles.length,
            detail: t('profile.workspaceRolesDetail'),
          },
          {
            label: t('profile.changePasswordTitle'),
            value: t('profile.workspacePasswordValue'),
            detail: t('profile.workspacePasswordDetail'),
          },
        ]}
      />

      <div className="profile-grid">
        <aside className="profile-card panel stack">
          <div className="profile-header">
            <div className="profile-avatar">{initials}</div>
            <div className="profile-meta">
              <div className="profile-name">{user?.displayName ?? user?.username}</div>
            </div>
          </div>

          <div className="actions profile-card__actions">
            <Link className="button button--secondary button--wide" to="/logout">{t('profile.signOut')}</Link>
          </div>
        </aside>

        <div className="workspace-layout workspace-layout--profile">
          <section className="workspace-layout__main profile-info stack">
            <div className="panel stack">
              <h3 className="form-section__title">{t('profile.identityTitle')}</h3>
              <dl className="detail-list">
                <div>
                  <dt>{t('profile.firstName')}</dt>
                  <dd>{firstName}</dd>
                </div>
                <div>
                  <dt>{t('profile.lastName')}</dt>
                  <dd>{lastName}</dd>
                </div>
                <div>
                  <dt>{t('profile.username')}</dt>
                  <dd>{profile?.username ?? user?.username ?? '-'}</dd>
                </div>
              </dl>
            </div>

            <div className="panel stack">
              <h3 className="form-section__title">{t('profile.rolesTitle')}</h3>
              {normalizedRoles.length > 0 ? (
                <div className="tag-list">
                  {normalizedRoles.map((role) => (
                    <span key={role} className="tag">
                      {formatProfileRoleLabel(role, language)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="muted">{t('profile.noRoles')}</p>
              )}
            </div>

            <div className="panel stack">
              <h3 className="form-section__title">{t('profile.changePasswordTitle')}</h3>
              {notice ? <div className="callout">{notice}</div> : null}
              <form className="stack" onSubmit={handleChangePassword}>
                <label className="stack">
                  <span className="card__label">{t('profile.newPassword')}</span>
                  <input
                    className="input"
                    type="password"
                    placeholder={t('profile.passwordPlaceholder')}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </label>
                <label className="stack">
                  <span className="card__label">{t('profile.confirmPassword')}</span>
                  <input
                    className="input"
                    type="password"
                    placeholder={t('profile.confirmPasswordPlaceholder')}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </label>
                <div className="actions actions--compact">
                  <button className="button" disabled={isSavingPassword} type="submit">
                    {isSavingPassword ? t('profile.savingPassword') : t('profile.savePassword')}
                  </button>
                </div>
              </form>
            </div>
          </section>

          <aside className="workspace-layout__side workspace-rail">
            <section className="workspace-rail__panel">
              <span className="card__label">{t('profile.identityTitle')}</span>
              <strong>{profile?.username ?? user?.username ?? '-'}</strong>
              <p className="muted">{t('profile.workspaceIdentityDetail')}</p>
            </section>

            <section className="workspace-rail__panel">
              <span className="card__label">{t('profile.rolesTitle')}</span>
              <strong>{normalizedRoles.length}</strong>
              <p className="muted">{t('profile.workspaceRolesDetail')}</p>
            </section>

            <section className="workspace-rail__panel">
              <span className="card__label">{t('profile.changePasswordTitle')}</span>
              <strong>{t('profile.workspacePasswordValue')}</strong>
              <p className="muted">{t('profile.workspacePasswordDetail')}</p>
            </section>
          </aside>
        </div>
      </div>

      <ErrorModal message={error} onClose={() => setError(null)} />
    </div>
  );
}

function formatProfileRoleLabel(role: Parameters<typeof formatRoleLabel>[0], language: 'th' | 'en') {
  if (language === 'en') {
    return formatRoleLabel(role);
  }

  switch (role) {
    case 'admin':
      return 'ผู้ดูแลระบบ';
    case 'audit_reader':
      return 'ผู้อ่าน Audit Log';
    case 'document_controller':
      return 'ผู้ควบคุมเอกสาร';
    case 'manager':
      return 'ผู้อนุมัติ';
    case 'signer':
      return 'ผู้ลงนาม';
    case 'user_admin':
      return 'ผู้ดูแลผู้ใช้';
    case 'viewer':
      return 'ผู้ใช้งานทั่วไป';
    default:
      return role;
  }
}

function splitDisplayName(displayName: string | null | undefined) {
  const normalized = displayName?.trim() ?? '';
  if (!normalized) {
    return { firstName: '', lastName: '' };
  }

  const parts = normalized.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}
