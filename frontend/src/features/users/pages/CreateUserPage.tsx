import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../auth/context/useAuth';
import { createUser } from '../api/usersApi';
import type { CreateUserInput } from '../types';

const initialForm: CreateUserInput = {
  username: '',
  email: '',
  displayName: '',
  password: '',
};

export function CreateUserPage() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<CreateUserInput>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken) {
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await createUser(form, accessToken);
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
    <section className="panel stack">
      <div className="actions">
        <Link className="button button--secondary" to="/users">Back to users</Link>
      </div>

      <div>
        <span className="sidebar__eyebrow">Admin</span>
        <h2>Create User</h2>
        <p className="muted">สร้างบัญชีผู้ใช้งานจาก InsightDocs แล้ว provision ไปยัง Keycloak พร้อมสร้าง access record ในระบบให้อัตโนมัติ</p>
      </div>

      {error ? <div className="callout callout--danger">{error}</div> : null}

      <form className="form-grid" onSubmit={handleSubmit}>
        <input
          className="input"
          placeholder="Username"
          value={form.username}
          onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
        />
        <input
          className="input"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
        />
        <input
          className="input"
          placeholder="Display name"
          value={form.displayName}
          onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
        />
        <input
          className="input"
          placeholder="Temporary password"
          type="password"
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
        />
        <div className="actions">
          <button className="button" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Creating...' : 'Create User'}
          </button>
          <Link className="button button--secondary" to="/users">Cancel</Link>
        </div>
      </form>
    </section>
  );
}
