import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../../auth/context/useAuth';
import { ErrorModal } from '../../../shared/components/state/ErrorModal';
import { getUser, updateUser } from '../api/usersApi';
import { AVAILABLE_PROJECT_ROLES, formatBusinessRole, formatBusinessRoleDescription, formatUserStatus, type AppUser, type UpdateUserInput } from '../types';
import { PageHeader } from '../../../shared/components/layout/PageHeader';

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
    <div className="stack stack--xl">
      <PageHeader
        title={`Edit User: ${resolvedName}`}
        eyebrow="Users & Access"
        description={`Manage identity details, password overrides, and system access roles for ${user.username}.`}
        actions={<Link className="button button--secondary" to="/users">Back to users</Link>}
      />

      <section className="panel stack">
        <div className="stack user-form-panel">
          <form className="stack stack--xl" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="stack" htmlFor="edit-user-email">
                <span className="card__label">Sign-in Email</span>
                <input
                  id="edit-user-email"
                  className="input"
                  placeholder="name@organization.com"
                  type="email"
                  value={form.email}
                  onChange={(event) => {
                    const email = event.target.value;
                    setForm((current) => ({ ...current, email, username: email }));
                  }}
                />
              </label>

              <div className="grid-2">
                <label className="stack" htmlFor="edit-user-first-name">
                  <span className="card__label">First Name</span>
                  <input
                    id="edit-user-first-name"
                    className="input"
                    placeholder="First name"
                    value={form.firstName}
                    onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                  />
                </label>
                <label className="stack" htmlFor="edit-user-last-name">
                  <span className="card__label">Last Name</span>
                  <input
                    id="edit-user-last-name"
                    className="input"
                    placeholder="Last name"
                    value={form.lastName}
                    onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                  />
                </label>
              </div>

              <div className="grid-2">
                <label className="stack" htmlFor="edit-user-password">
                  <span className="card__label">New Password</span>
                  <input
                    id="edit-user-password"
                    className="input"
                    placeholder="Leave blank to keep current"
                    type="password"
                    value={form.password ?? ''}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  />
                </label>
                <label className="stack" htmlFor="edit-user-confirm-password">
                  <span className="card__label">Confirm New Password</span>
                  <input
                    id="edit-user-confirm-password"
                    className="input"
                    placeholder="Confirm new password"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                  />
                </label>
              </div>
            </div>

            <fieldset className="stack role-group">
              <span className="card__label" style={{ marginBottom: '12px' }}>System Roles & Permissions</span>
              <div className="table-wrap role-table-wrap">
                <table className="table role-table table--premium">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Select</th>
                      <th>Role</th>
                      <th>Capability Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {AVAILABLE_PROJECT_ROLES.map((role) => (
                      <tr key={role} onClick={() => {
                        const isChecked = form.roles.includes(role);
                        setForm((current) => ({
                          ...current,
                          roles: !isChecked
                            ? [...current.roles, role]
                            : current.roles.filter((value) => value !== role),
                        }));
                      }} className="table__row--interactive">
                        <td onClick={(e) => e.stopPropagation()}>
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
                        <td style={{ fontWeight: 700 }}>{formatBusinessRole(role)}</td>
                        <td className="muted" style={{ fontSize: '13px' }}>{formatBusinessRoleDescription(role)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </fieldset>

            <div className="actions" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px' }}>
              <button className="button" disabled={isSaving} type="submit" style={{ minWidth: '160px' }}>
                {isSaving ? 'Saving...' : 'บันทึกการแก้ไข'}
              </button>
              <Link className="button button--secondary" to="/users">ยกเลิก</Link>
            </div>
          </form>
        </div>

        <ErrorModal message={error} onClose={() => setError(null)} />
      </section>
    </div>
  );
}

function formatUserName(user: AppUser) {
  const fullName = [user.firstName, user.lastName]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .trim();

  return fullName || user.displayName || user.username;
}
