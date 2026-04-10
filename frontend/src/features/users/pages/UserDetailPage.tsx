import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../../auth/context/useAuth';
import {
  approveUser,
  disableUser,
  enableUser,
  getUser,
} from '../api/usersApi';
import { formatBusinessRole, type AppUser } from '../types';

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const [user, setUser] = useState<AppUser | null>(null);
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

  async function runMutation(action: () => Promise<AppUser | void>, successMessage: string) {
    try {
      const result = await action();
      if (result) {
        setUser(result);
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
        <Link className="button button--secondary" to="/users">Back to users</Link>
      </div>

      <div>
        <span className="sidebar__eyebrow">User Detail</span>
        <h2>{resolvedName}</h2>
        <p className="muted">Status: {user.status} | Approved by: {user.approvedBy ?? 'Not approved yet'}</p>
      </div>

      <div className="callout">
        Identity details and business roles are sourced from Keycloak. This access record is bound to the same UUID as the Keycloak account and cannot be edited separately.
      </div>

      {error ? <div className="callout callout--danger">{error}</div> : null}
      {notice ? <div className="callout">{notice}</div> : null}

      <div className="card stack">
        <span className="card__label">Keycloak Roles</span>
        <div className="actions">
          {user.roles.length > 0 ? (
            user.roles.map((role) => (
              <span key={role} className="button button--secondary">
                {formatBusinessRole(role)}
              </span>
            ))
          ) : (
            <span className="muted">No Keycloak roles mapped to this account.</span>
          )}
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

function formatUserName(user: AppUser) {
  const fullName = [user.firstName, user.lastName]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .trim();

  return fullName || user.displayName || user.username;
}
