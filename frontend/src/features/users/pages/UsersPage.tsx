import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useAuth } from '../../auth/context/useAuth';
import { getUsers } from '../api/usersApi';
import { formatUserStatus, getProjectRoleLabels, type AppUser } from '../types';

export function UsersPage() {
  const { accessToken } = useAuth();
  const location = useLocation();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice] = useState<string | null>((location.state as { notice?: string } | null)?.notice ?? null);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <section className="panel panel--full stack">
      <div>
        <span className="sidebar__eyebrow">Admin</span>
        <h2>Users & Access</h2>
        <p className="muted">สร้างผู้ใช้งานจากระบบนี้ แล้ว provision บัญชีไปยัง Keycloak พร้อมสร้าง access record ใน InsightDocs ให้เชื่อมกันอัตโนมัติ</p>
      </div>

      {error ? <div className="callout callout--danger">{error}</div> : null}
      {notice ? <div className="callout">{notice}</div> : null}

      <div className="actions">
        <Link className="button" to="/users/new">Create User</Link>
      </div>

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
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <Link to={`/users/${user.id}`}>{formatUserName(user)}</Link>
                  </td>
                  <td>{user.email}</td>
                  <td>{formatUserStatus(user.status)}</td>
                  <td>{getProjectRoleLabels(user.roles).join(', ') || 'ไม่มีบทบาทในระบบ'}</td>
                  <td>
                    <div className="actions actions--compact">
                      <Link className="button button--secondary" to={`/users/${user.id}`}>
                        แก้ไข
                      </Link>
                    </div>
                  </td>
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
