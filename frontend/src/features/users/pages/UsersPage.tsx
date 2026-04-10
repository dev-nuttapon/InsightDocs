import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useAuth } from '../../auth/context/useAuth';
import { deleteUser, disableUser, enableUser, getUsers } from '../api/usersApi';
import { canDisableUser, canEnableUser, formatUserStatus, getProjectRoleLabels, type AppUser } from '../types';

export function UsersPage() {
  const { accessToken } = useAuth();
  const location = useLocation();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>((location.state as { notice?: string } | null)?.notice ?? null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);

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

  async function runRowAction(
    userId: string,
    action: () => Promise<AppUser | void>,
    successMessage: string,
    options?: { remove?: boolean },
  ) {
    if (!accessToken) {
      return;
    }

    try {
      setBusyUserId(userId);
      const result = await action();
      setUsers((current) => {
        if (options?.remove) {
          return current.filter((user) => user.id !== userId);
        }

        if (!result) {
          return current;
        }

        return current.map((user) => (user.id === userId ? result : user));
      });
      setNotice(successMessage);
      setError(null);
      setOpenMenuUserId(null);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Action failed.');
      setNotice(null);
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleDelete(user: AppUser) {
    if (!accessToken) {
      return;
    }

    const confirmed = window.confirm(`ยืนยันการลบผู้ใช้งาน ${formatUserName(user)} ออกจาก InsightDocs และ Keycloak?`);
    if (!confirmed) {
      return;
    }

    await runRowAction(
      user.id,
      () => deleteUser(user.id, accessToken),
      'ลบผู้ใช้งานสำเร็จ',
      { remove: true },
    );
  }

  async function handleDisable(user: AppUser) {
    const confirmed = window.confirm(`ยืนยันการปิดการใช้งานผู้ใช้ ${formatUserName(user)} ?`);
    if (!confirmed) {
      return;
    }

    await runRowAction(
      user.id,
      () => disableUser(user.id, accessToken!),
      'ปิดการใช้งานผู้ใช้สำเร็จ',
    );
  }

  async function handleEnable(user: AppUser) {
    const confirmed = window.confirm(`ยืนยันการเปิดการใช้งานผู้ใช้ ${formatUserName(user)} ?`);
    if (!confirmed) {
      return;
    }

    await runRowAction(
      user.id,
      () => enableUser(user.id, accessToken!),
      'เปิดการใช้งานผู้ใช้สำเร็จ',
    );
  }

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
                  <td>{formatUserStatus(user.status, user.approvedAt)}</td>
                  <td>{getProjectRoleLabels(user.roles).join(', ') || 'ไม่มีบทบาทในระบบ'}</td>
                  <td>
                    <div className="row-menu">
                      <button
                        className="button button--secondary"
                        disabled={busyUserId === user.id}
                        type="button"
                        onClick={() => setOpenMenuUserId((current) => (current === user.id ? null : user.id))}
                      >
                        {busyUserId === user.id ? 'กำลังบันทึก...' : 'ตัวเลือก'}
                      </button>
                      {openMenuUserId === user.id ? (
                        <div className="topbar__menu-panel row-menu__panel">
                          <Link
                            className="topbar__menu-link"
                            to={`/users/${user.id}/edit`}
                            onClick={() => setOpenMenuUserId(null)}
                          >
                            แก้ไข
                          </Link>
                          {canDisableUser(user.status, user.approvedAt) ? (
                            <button
                              className="topbar__menu-link topbar__menu-link--button"
                              disabled={busyUserId === user.id}
                              type="button"
                              onClick={() => void handleDisable(user)}
                            >
                              ปิดการใช้งาน
                            </button>
                          ) : null}
                          {canEnableUser(user.status, user.approvedAt) ? (
                            <button
                              className="topbar__menu-link topbar__menu-link--button"
                              disabled={busyUserId === user.id}
                              type="button"
                              onClick={() => void handleEnable(user)}
                            >
                              เปิดการใช้งาน
                            </button>
                          ) : null}
                          <button
                            className="topbar__menu-link topbar__menu-link--button"
                            disabled={busyUserId === user.id}
                            type="button"
                            onClick={() => void handleDelete(user)}
                          >
                            ลบ
                          </button>
                        </div>
                      ) : null}
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
