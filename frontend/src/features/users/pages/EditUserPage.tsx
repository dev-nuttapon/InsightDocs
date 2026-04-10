import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../../auth/context/useAuth';
import { getUser, updateUser } from '../api/usersApi';
import { formatUserStatus, getProjectRoleLabels, type AppUser, type UpdateUserInput } from '../types';

export function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<AppUser | null>(null);
  const [form, setForm] = useState<UpdateUserInput>({ username: '', email: '', displayName: '' });
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
            displayName: payload.displayName,
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
  const projectRoles = useMemo(() => getProjectRoleLabels(user?.roles ?? []), [user?.roles]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!id || !accessToken) {
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        ...form,
        username: form.email.trim(),
      };
      const updated = await updateUser(id, payload, accessToken);
      navigate(`/users/${updated.id}`, {
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
      </section>
    );
  }

  return (
    <section className="panel stack">
      <div className="actions">
        <Link className="button button--secondary" to={`/users/${id}`}>Back to user detail</Link>
      </div>

      <div>
        <span className="sidebar__eyebrow">Edit User</span>
        <h2>{resolvedName}</h2>
        <p className="muted">Status: {formatUserStatus(user.status)} | Approved by: {user.approvedBy ?? 'Not approved yet'}</p>
      </div>

      {error ? <div className="callout callout--danger">{error}</div> : null}

      <div className="card stack user-form-card">
        <span className="card__label">Project Roles</span>
        <div className="actions">
          {projectRoles.length > 0 ? (
            projectRoles.map((role) => (
              <span key={role} className="button button--secondary">
                {role}
              </span>
            ))
          ) : (
            <span className="muted">ไม่มีบทบาทของ InsightDocs ที่ผูกกับบัญชีนี้</span>
          )}
        </div>
      </div>

      <div className="card stack user-form-card">
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
          <label className="stack" htmlFor="edit-user-display-name">
            <span>Display Name</span>
            <input
              id="edit-user-display-name"
              className="input"
              placeholder="Display name"
              value={form.displayName}
              onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
            />
          </label>
          <div className="actions">
            <button className="button" disabled={isSaving} type="submit">
              {isSaving ? 'Saving...' : 'บันทึกการแก้ไข'}
            </button>
            <Link className="button button--secondary" to={`/users/${id}`}>ยกเลิก</Link>
          </div>
        </form>
      </div>
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
