import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../auth/context/useAuth';
import { createUser, getUsers } from '../api/usersApi';
import { formatBusinessRole, type AppUser, type CreateUserInput } from '../types';

const initialForm: CreateUserInput = {
  keycloakUserId: '',
  username: '',
  email: '',
  displayName: '',
};

export function UsersPage() {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [form, setForm] = useState<CreateUserInput>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!accessToken) {
        return;
      }

      try {
        const payload = await getUsers(accessToken);
        if (!ignore) {
          setUsers(payload);
          setError(null);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load users.');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [accessToken]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken) {
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await createUser(form, accessToken);
      setUsers((current) => [...current, created].sort((left, right) => left.username.localeCompare(right.username)));
      setForm(initialForm);
      setError(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create user.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel stack">
      <div>
        <span className="sidebar__eyebrow">Admin</span>
        <h2>Users & Access</h2>
        <p className="muted">Review local access records while identity details and business roles are resolved from Keycloak.</p>
      </div>

      {error ? <div className="callout callout--danger">{error}</div> : null}

      <form className="form-grid" onSubmit={handleCreate}>
        <input
          className="input"
          placeholder="Keycloak User Id"
          value={form.keycloakUserId}
          onChange={(event) => setForm((current) => ({ ...current, keycloakUserId: event.target.value }))}
        />
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
          placeholder="Display Name"
          value={form.displayName}
          onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
        />
        <button className="button" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Creating...' : 'Create Access Record'}
        </button>
      </form>

      {isLoading ? (
        <p className="muted">Loading users...</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Sign-in Email</th>
                <th>Status</th>
                <th>Roles</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <Link to={`/users/${user.id}`}>{formatUserName(user)}</Link>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.status}</td>
                  <td>{user.roles.map(formatBusinessRole).join(', ') || 'No roles'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function formatUserName(user: AppUser) {
  const fullName = [user.firstName, user.lastName]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .trim();

  return fullName || user.username;
}
