import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../../auth/context/useAuth';
import {
  approveUser,
  assignRole,
  disableUser,
  enableUser,
  getUser,
  removeRole,
  updateUser,
} from '../api/usersApi';
import { businessRoles, type AppUser, type UpdateUserInput } from '../types';

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const [user, setUser] = useState<AppUser | null>(null);
  const [form, setForm] = useState<UpdateUserInput | null>(null);
  const [roleName, setRoleName] = useState<string>(businessRoles[0]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
            keycloakUserId: payload.keycloakUserId,
            username: payload.username,
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

  const availableRoles = useMemo(
    () => businessRoles.filter((role) => !user?.roles.includes(role)),
    [user],
  );

  async function runMutation(action: () => Promise<AppUser | void>, successMessage: string) {
    try {
      const result = await action();
      if (result) {
        setUser(result);
        setForm({
          keycloakUserId: result.keycloakUserId,
          username: result.username,
          email: result.email,
          displayName: result.displayName,
        });
      } else if (id && accessToken) {
        const refreshed = await getUser(id, accessToken);
        setUser(refreshed);
      }
      setNotice(successMessage);
      setError(null);
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : 'Action failed.');
      setNotice(null);
    }
  }

  if (!user || !form || !accessToken || !id) {
    return (
      <section className="panel">
        <p className="muted">{error ?? 'Loading user...'}</p>
      </section>
    );
  }

  return (
    <section className="panel stack">
      <div className="actions">
        <Link className="button button--secondary" to="/users">Back to users</Link>
      </div>

      <div>
        <span className="sidebar__eyebrow">User Detail</span>
        <h2>{user.displayName}</h2>
        <p className="muted">Status: {user.status} | Approved by: {user.approvedBy ?? 'Not approved yet'}</p>
      </div>

      {error ? <div className="callout callout--danger">{error}</div> : null}
      {notice ? <div className="callout">{notice}</div> : null}

      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          void runMutation(() => updateUser(id, form, accessToken), 'User profile updated.');
        }}
      >
        <input className="input" value={form.keycloakUserId} onChange={(event) => setForm((current) => current ? { ...current, keycloakUserId: event.target.value } : current)} />
        <input className="input" value={form.username} onChange={(event) => setForm((current) => current ? { ...current, username: event.target.value } : current)} />
        <input className="input" type="email" value={form.email} onChange={(event) => setForm((current) => current ? { ...current, email: event.target.value } : current)} />
        <input className="input" value={form.displayName} onChange={(event) => setForm((current) => current ? { ...current, displayName: event.target.value } : current)} />
        <button className="button" type="submit">Save User</button>
      </form>

      <div className="card stack">
        <span className="card__label">Assigned Roles</span>
        <div className="actions">
          {user.roles.map((role) => (
            <button
              key={role}
              className="button button--secondary"
              type="button"
              onClick={() => void runMutation(async () => {
                await removeRole(id, role, accessToken);
              }, `Removed role ${role}.`)}
            >
              Remove {role}
            </button>
          ))}
        </div>
        <div className="actions">
          <select className="input input--select" value={roleName} onChange={(event) => setRoleName(event.target.value)}>
            {availableRoles.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <button
            className="button"
            disabled={availableRoles.length === 0}
            type="button"
            onClick={() => void runMutation(() => assignRole(id, roleName, accessToken), `Assigned role ${roleName}.`)}
          >
            Assign Role
          </button>
        </div>
      </div>

      <div className="actions">
        <button className="button" type="button" onClick={() => void runMutation(() => approveUser(id, accessToken), 'User approved.')}>Approve</button>
        <button className="button button--secondary" type="button" onClick={() => void runMutation(() => disableUser(id, accessToken), 'User disabled.')}>Disable</button>
        <button className="button button--secondary" type="button" onClick={() => void runMutation(() => enableUser(id, accessToken), 'User enabled.')}>Enable</button>
      </div>
    </section>
  );
}
