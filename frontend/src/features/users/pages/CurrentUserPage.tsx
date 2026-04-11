import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { changePassword } from '../../auth/api/authApi';
import { getUserProfile } from '../../auth/services/keycloakAuth';
import { useAuth } from '../../auth/context/useAuth';
import { buildAccessProfile, formatRoleLabel } from '../../../shared/auth/authorization';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { ErrorModal } from '../../../shared/components/state/ErrorModal';

export function CurrentUserPage() {
  const { accessToken, user } = useAuth();
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
      setError('ไม่พบ session สำหรับเปลี่ยนรหัสผ่าน');
      return;
    }

    if (newPassword.trim().length < 8) {
      setError('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านใหม่และยืนยันรหัสผ่านต้องตรงกัน');
      return;
    }

    try {
      setIsSavingPassword(true);
      setError(null);
      await changePassword(newPassword, accessToken);
      setNotice('เปลี่ยนรหัสผ่านสำเร็จ');
      setNewPassword('');
      setConfirmPassword('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
      setNotice(null);
    } finally {
      setIsSavingPassword(false);
    }
  }

  return (
    <div className="stack stack--xl">
      <PageHeader
        title="ข้อมูลบัญชีของฉัน"
        eyebrow="My Profile"
        description="ตรวจสอบข้อมูลบัญชีที่ใช้เข้าสู่ระบบ บทบาทที่ได้รับ และดำเนินการที่เกี่ยวข้องกับบัญชีของคุณ"
      />

      <div className="profile-grid">
        <aside className="profile-card panel stack">
          <div className="profile-header">
            <div className="profile-avatar">{initials}</div>
            <div className="profile-meta">
              <div className="profile-name">{user?.displayName ?? user?.username}</div>
            </div>
          </div>

          <div className="actions" style={{ flexDirection: 'column', gap: '8px' }}>
            <Link className="button button--secondary button--wide" to="/logout">Sign Out</Link>
          </div>
        </aside>

        <section className="profile-info stack">
          <div className="panel stack">
            <h3 className="form-section__title">ข้อมูลผู้ใช้งาน</h3>
            <dl className="detail-list">
              <div>
                <dt>ชื่อ</dt>
                <dd>{firstName}</dd>
              </div>
              <div>
                <dt>นามสกุล</dt>
                <dd>{lastName}</dd>
              </div>
              <div>
                <dt>ชื่อผู้ใช้</dt>
                <dd>{profile?.username ?? user?.username ?? '-'}</dd>
              </div>
            </dl>
          </div>

          <div className="panel stack">
            <h3 className="form-section__title">บทบาทในระบบ</h3>
            {normalizedRoles.length > 0 ? (
              <div className="tag-list">
                {normalizedRoles.map((role) => (
                  <span key={role} className="tag">
                    {formatRoleLabel(role)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="muted">ไม่พบบทบาทที่ผูกกับบัญชีนี้</p>
            )}
          </div>

          <div className="panel stack">
            <h3 className="form-section__title">เปลี่ยนรหัสผ่าน</h3>
            {notice ? <div className="callout">{notice}</div> : null}
            <form className="stack" onSubmit={handleChangePassword}>
              <label className="stack">
                <span className="card__label">รหัสผ่านใหม่</span>
                <input
                  className="input"
                  type="password"
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                />
              </label>
              <label className="stack">
                <span className="card__label">ยืนยันรหัสผ่านใหม่</span>
                <input
                  className="input"
                  type="password"
                  placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                />
              </label>
              <div className="actions actions--compact">
                <button className="button" disabled={isSavingPassword} type="submit">
                  {isSavingPassword ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>

      <ErrorModal message={error} onClose={() => setError(null)} />
    </div>
  );
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
