import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../../auth/context/useAuth';
import { ErrorModal } from '../../../shared/components/state/ErrorModal';
import { getUser, updateUser } from '../api/usersApi';
import { AVAILABLE_PROJECT_ROLES, formatBusinessRole, formatBusinessRoleDescription, formatUserStatus, type AppUser, type UpdateUserInput } from '../types';

type EditUserFormState = UpdateUserInput & {
  confirmPassword: string;
};

export function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<AppUser | null>(null);
  const [form, setForm] = useState<EditUserFormState>({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    roles: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!id || !accessToken) {
        return;
      }

      try {
        const payload = await getUser(id, accessToken);
        if (!ignore) {
          setUser(payload);
          setForm({
            username: payload.email,
            email: payload.email,
            firstName: payload.firstName ?? '',
            lastName: payload.lastName ?? '',
            password: '',
            confirmPassword: '',
            roles: payload.roles,
          });
          setError(null);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load user.');
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [accessToken, id]);

  const resolvedName = useMemo(() => (user ? formatUserName(user) : 'User'), [user]);
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!id || !accessToken) {
      return;
    }

    if (form.password && form.password !== form.confirmPassword) {
      setError('รหัสผ่านและยืนยันรหัสผ่านต้องตรงกัน');
      return;
    }

    if (form.roles.length === 0) {
      setError('กรุณาเลือกอย่างน้อย 1 role');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const payload = {
        username: form.email.trim(),
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        password: form.password?.trim() ? form.password : undefined,
        roles: form.roles,
      };
      await updateUser(id, payload, accessToken);
      navigate('/users', {
        replace: true,
        state: {
          notice: 'อัปเดตข้อมูลผู้ใช้งานสำเร็จ',
        },
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update user.');
    } finally {
      setIsSaving(false);
    }
  }

  if (!user || !accessToken || !id) {
    return (
      <section className="panel">
        <p className="muted">{error ?? 'Loading user...'}</p>
        <ErrorModal message={error} onClose={() => setError(null)} />
      </section>
    );
  }

  return (
    <section className="panel panel--full stack">
      <div className="actions">
        <Link className="button button--secondary" to="/users">กลับไปรายการผู้ใช้</Link>
      </div>

      <div>
        <span className="sidebar__eyebrow">จัดการผู้ใช้งาน</span>
        <h2>{resolvedName}</h2>
        <p className="muted">Status: {formatUserStatus(user.status)} | Approved by: {user.approvedBy ?? 'Not approved yet'}</p>
      </div>

      <div className="card stack">
        <span className="card__label">ข้อมูลปัจจุบัน</span>
        <div>Username: {user.username}</div>
        <div>Email: {user.email}</div>
        <div>Display name: {user.displayName}</div>
      </div>

      <div className="stack user-form-panel">
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="stack" htmlFor="edit-user-email">
            <span>Email</span>
            <input
              id="edit-user-email"
              className="input"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(event) => {
                const email = event.target.value;
                setForm((current) => ({ ...current, email, username: email }));
              }}
            />
          </label>
          <label className="stack" htmlFor="edit-user-first-name">
            <span>ชื่อ</span>
            <input
              id="edit-user-first-name"
              className="input"
              placeholder="ชื่อ"
              value={form.firstName}
              onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
            />
          </label>
          <label className="stack" htmlFor="edit-user-last-name">
            <span>นามสกุล</span>
            <input
              id="edit-user-last-name"
              className="input"
              placeholder="นามสกุล"
              value={form.lastName}
              onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
            />
          </label>
          <label className="stack" htmlFor="edit-user-password">
            <span>รหัสผ่านใหม่</span>
            <input
              id="edit-user-password"
              className="input"
              placeholder="เว้นว่างหากไม่ต้องการเปลี่ยน"
              type="password"
              value={form.password ?? ''}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
          </label>
          <label className="stack" htmlFor="edit-user-confirm-password">
            <span>ยืนยันรหัสผ่านใหม่</span>
            <input
              id="edit-user-confirm-password"
              className="input"
              placeholder="ยืนยันรหัสผ่านใหม่"
              type="password"
              value={form.confirmPassword}
              onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
            />
          </label>
          <fieldset className="stack role-group">
            <legend>Roles</legend>
            <div className="table-wrap role-table-wrap">
              <table className="table role-table">
                <thead>
                  <tr>
                    <th>เลือก</th>
                    <th>Role</th>
                    <th>คำอธิบาย</th>
                  </tr>
                </thead>
                <tbody>
                  {AVAILABLE_PROJECT_ROLES.map((role) => (
                    <tr key={role}>
                      <td>
                        <input
                          type="checkbox"
                          checked={form.roles.includes(role)}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              roles: event.target.checked
                                ? [...current.roles, role]
                                : current.roles.filter((value) => value !== role),
                            }))
                          }
                        />
                      </td>
                      <td>{formatBusinessRole(role)}</td>
                      <td className="muted">{formatBusinessRoleDescription(role)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </fieldset>
          <div className="actions">
            <button className="button" disabled={isSaving} type="submit">
              {isSaving ? 'Saving...' : 'บันทึกการแก้ไข'}
            </button>
            <Link className="button button--secondary" to="/users">ยกเลิก</Link>
          </div>
        </form>
      </div>

      <ErrorModal message={error} onClose={() => setError(null)} />
    </section>
  );
}

function formatUserName(user: AppUser) {
  const fullName = [user.firstName, user.lastName]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .trim();

  return fullName || user.displayName || user.username;
}
