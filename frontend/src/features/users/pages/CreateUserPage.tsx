import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../auth/context/useAuth';
import { createUser } from '../api/usersApi';
import { AVAILABLE_PROJECT_ROLES, formatBusinessRole, formatBusinessRoleDescription, type CreateUserInput } from '../types';

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
    <section className="panel panel--full stack">
      <div className="actions">
        <Link className="button button--secondary" to="/users">Back to users</Link>
      </div>

      <div>
        <span className="sidebar__eyebrow">Admin</span>
        <h2>Create User</h2>
        <p className="muted">สร้างบัญชีผู้ใช้งานจาก InsightDocs แล้ว provision ไปยัง Keycloak พร้อมสร้าง access record ในระบบให้อัตโนมัติ</p>
      </div>

      {error ? <div className="callout callout--danger">{error}</div> : null}

      <div className="stack user-form-panel">
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="stack" htmlFor="create-user-email">
            <span>Email</span>
            <input
              id="create-user-email"
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
          <label className="stack" htmlFor="create-user-first-name">
            <span>ชื่อ</span>
            <input
              id="create-user-first-name"
              className="input"
              placeholder="ชื่อ"
              value={form.firstName}
              onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
            />
          </label>
          <label className="stack" htmlFor="create-user-last-name">
            <span>นามสกุล</span>
            <input
              id="create-user-last-name"
              className="input"
              placeholder="นามสกุล"
              value={form.lastName}
              onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
            />
          </label>
          <label className="stack" htmlFor="create-user-password">
            <span>รหัสผ่าน</span>
            <input
              id="create-user-password"
              className="input"
              placeholder="รหัสผ่าน"
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
          </label>
          <label className="stack" htmlFor="create-user-confirm-password">
            <span>ยืนยันรหัสผ่าน</span>
            <input
              id="create-user-confirm-password"
              className="input"
              placeholder="ยืนยันรหัสผ่าน"
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
            <button className="button" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Creating...' : 'Create User'}
            </button>
            <Link className="button button--secondary" to="/users">Cancel</Link>
          </div>
        </form>
      </div>
    </section>
  );
}
