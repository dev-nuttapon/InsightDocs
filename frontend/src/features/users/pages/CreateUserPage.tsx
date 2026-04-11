import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../auth/context/useAuth';
import { ErrorModal } from '../../../shared/components/state/ErrorModal';
import { createUser } from '../api/usersApi';
import { AVAILABLE_PROJECT_ROLES, formatBusinessRole, formatBusinessRoleDescription, type CreateUserInput } from '../types';
import { PageHeader } from '../../../shared/components/layout/PageHeader';

type CreateUserFormState = CreateUserInput & {
  confirmPassword: string;
};

const initialForm: CreateUserFormState = {
  username: '',
  email: '',
  firstName: '',
  lastName: '',
  password: '',
  confirmPassword: '',
  roles: [],
};

export function CreateUserPage() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<CreateUserFormState>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken) {
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('รหัสผ่านและยืนยันรหัสผ่านต้องตรงกัน');
      return;
    }

    if (form.roles.length === 0) {
      setError('กรุณาเลือกอย่างน้อย 1 role');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const payload = {
        username: form.email.trim(),
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        password: form.password,
        roles: form.roles,
      };
      const created = await createUser(payload, accessToken);
      navigate('/users', {
        replace: true,
        state: {
          notice: `สร้างผู้ใช้งาน ${created.displayName || created.username} สำเร็จ และส่งข้อมูลไปยัง Keycloak แล้ว`,
        },
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create user.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="stack stack--xl">
      <PageHeader
        title="Invite User"
        eyebrow="Users & Access"
        description="สร้างบัญชีผู้ใช้งานจาก InsightDocs แล้ว provision ไปยัง Keycloak พร้อมสร้าง access record ในระบบให้อัตโนมัติ"
        actions={<Link className="button button--secondary" to="/users">Back to users</Link>}
      />

      <section className="panel stack">
        <div className="stack user-form-panel">
          <form className="stack stack--xl" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="stack" htmlFor="create-user-email">
                <span className="card__label">Sign-in Email</span>
                <input
                  id="create-user-email"
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
                <label className="stack" htmlFor="create-user-first-name">
                  <span className="card__label">First Name</span>
                  <input
                    id="create-user-first-name"
                    className="input"
                    placeholder="First name"
                    value={form.firstName}
                    onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                  />
                </label>
                <label className="stack" htmlFor="create-user-last-name">
                  <span className="card__label">Last Name</span>
                  <input
                    id="create-user-last-name"
                    className="input"
                    placeholder="Last name"
                    value={form.lastName}
                    onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                  />
                </label>
              </div>

              <div className="grid-2">
                <label className="stack" htmlFor="create-user-password">
                  <span className="card__label">Password</span>
                  <input
                    id="create-user-password"
                    className="input"
                    placeholder="••••••••"
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  />
                </label>
                <label className="stack" htmlFor="create-user-confirm-password">
                  <span className="card__label">Confirm Password</span>
                  <input
                    id="create-user-confirm-password"
                    className="input"
                    placeholder="••••••••"
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
              <button className="button" disabled={isSubmitting} type="submit" style={{ minWidth: '160px' }}>
                {isSubmitting ? 'Inviting...' : 'Send Invitation'}
              </button>
              <Link className="button button--secondary" to="/users">Cancel</Link>
            </div>
          </form>
        </div>

        <ErrorModal message={error} onClose={() => setError(null)} />
      </section>
    </div>
  );
}
