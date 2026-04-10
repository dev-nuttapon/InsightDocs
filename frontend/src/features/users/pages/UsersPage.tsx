import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useAuth } from '../../auth/context/useAuth';
import { ErrorModal } from '../../../shared/components/state/ErrorModal';
import { deleteUser, disableUser, enableUser, getUsers } from '../api/usersApi';
import { canDisableUser, canEnableUser, formatUserStatus, getProjectRoleLabels, type AppUser } from '../types';

type PendingAction =
  | {
      type: 'enable' | 'disable' | 'delete';
      user: AppUser;
    }
  | null;

export function UsersPage() {
  const { accessToken } = useAuth();
  const location = useLocation();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>((location.state as { notice?: string } | null)?.notice ?? null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

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

    await runRowAction(
      user.id,
      () => deleteUser(user.id, accessToken),
      'ลบผู้ใช้งานสำเร็จ',
      { remove: true },
    );
  }

  async function handleDisable(user: AppUser) {
    await runRowAction(
      user.id,
      () => disableUser(user.id, accessToken!),
      'ปิดการใช้งานผู้ใช้สำเร็จ',
    );
  }

  async function handleEnable(user: AppUser) {
    await runRowAction(
      user.id,
      () => enableUser(user.id, accessToken!),
      'เปิดการใช้งานผู้ใช้สำเร็จ',
    );
  }

  async function handleConfirmAction() {
    if (!pendingAction) {
      return;
    }

    const { type, user } = pendingAction;
    setPendingAction(null);

    if (type === 'disable') {
      await handleDisable(user);
      return;
    }

    if (type === 'enable') {
      await handleEnable(user);
      return;
    }

    await handleDelete(user);
  }

  const pendingActionCopy = getPendingActionCopy(pendingAction);

  return (
    <section className="panel panel--full stack">
      <div>
        <span className="sidebar__eyebrow">Admin</span>
        <h2>Users & Access</h2>
        <p className="muted">สร้างผู้ใช้งานจากระบบนี้ แล้ว provision บัญชีไปยัง Keycloak พร้อมสร้าง access record ใน InsightDocs ให้เชื่อมกันอัตโนมัติ</p>
      </div>

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
                  <td>
                    {getProjectRoleLabels(user.roles).length > 0 ? (
                      <div className="tag-list">
                        {getProjectRoleLabels(user.roles).map((role) => (
                          <span key={`${user.id}-${role}`} className="tag">
                            {role}
                          </span>
                        ))}
                      </div>
                    ) : (
                      'ไม่มีบทบาทในระบบ'
                    )}
                  </td>
                  <td>
                    <div className="row-menu">
                      <button
                        className="button button--secondary row-menu__trigger"
                        aria-label="ตัวเลือกการจัดการผู้ใช้"
                        disabled={busyUserId === user.id}
                        title="ตัวเลือก"
                        type="button"
                        onClick={() => setOpenMenuUserId((current) => (current === user.id ? null : user.id))}
                      >
                        <span className="row-menu__trigger-icon" aria-hidden="true">{busyUserId === user.id ? '⋮' : '⋯'}</span>
                      </button>
                      {openMenuUserId === user.id ? (
                        <div className="topbar__menu-panel row-menu__panel">
                          <p className="row-menu__title">จัดการผู้ใช้</p>
                          <div className="row-menu__actions">
                            <Link
                              className="topbar__menu-link"
                              to={`/users/${user.id}/edit`}
                              onClick={() => setOpenMenuUserId(null)}
                            >
                              แก้ไขข้อมูล
                            </Link>
                            {canDisableUser(user.status, user.approvedAt) ? (
                              <button
                                className="topbar__menu-link topbar__menu-link--button"
                                disabled={busyUserId === user.id}
                                type="button"
                                onClick={() => {
                                  setOpenMenuUserId(null);
                                  setPendingAction({ type: 'disable', user });
                                }}
                              >
                                ปิดการใช้งาน
                              </button>
                            ) : null}
                            {canEnableUser(user.status, user.approvedAt) ? (
                              <button
                                className="topbar__menu-link topbar__menu-link--button"
                                disabled={busyUserId === user.id}
                                type="button"
                                onClick={() => {
                                  setOpenMenuUserId(null);
                                  setPendingAction({ type: 'enable', user });
                                }}
                              >
                                เปิดการใช้งาน
                              </button>
                            ) : null}
                            <button
                              className="topbar__menu-link topbar__menu-link--button row-menu__action--danger"
                              disabled={busyUserId === user.id}
                              type="button"
                              onClick={() => {
                                setOpenMenuUserId(null);
                                setPendingAction({ type: 'delete', user });
                              }}
                            >
                              ลบผู้ใช้งาน
                            </button>
                          </div>
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

      {pendingAction && pendingActionCopy ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setPendingAction(null)}>
          <div
            aria-labelledby="users-action-modal-title"
            aria-modal="true"
            className="modal-card stack"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="stack stack--compact">
              <span className="sidebar__eyebrow">Confirm</span>
              <h3 id="users-action-modal-title">{pendingActionCopy.title}</h3>
              <p className="muted">{pendingActionCopy.message}</p>
            </div>
            <div className="actions actions--compact">
              <button
                className={`button ${pendingActionCopy.tone === 'danger' ? 'button--danger' : ''}`}
                disabled={busyUserId === pendingAction.user.id}
                type="button"
                onClick={() => void handleConfirmAction()}
              >
                {busyUserId === pendingAction.user.id ? 'กำลังบันทึก...' : pendingActionCopy.confirmLabel}
              </button>
              <button
                className="button button--secondary"
                disabled={busyUserId === pendingAction.user.id}
                type="button"
                onClick={() => setPendingAction(null)}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ErrorModal message={error} onClose={() => setError(null)} />
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

function getPendingActionCopy(pendingAction: PendingAction) {
  if (!pendingAction) {
    return null;
  }

  const userName = formatUserName(pendingAction.user);

  switch (pendingAction.type) {
    case 'disable':
      return {
        title: 'ยืนยันการปิดการใช้งานผู้ใช้',
        message: `ต้องการปิดการใช้งาน ${userName} ใช่หรือไม่ ผู้ใช้นี้จะไม่สามารถเข้าสู่ระบบได้จนกว่าจะเปิดใช้งานอีกครั้ง`,
        confirmLabel: 'ยืนยันการปิดการใช้งาน',
        tone: 'default' as const,
      };
    case 'enable':
      return {
        title: 'ยืนยันการเปิดการใช้งานผู้ใช้',
        message: `ต้องการเปิดการใช้งาน ${userName} ใช่หรือไม่ ผู้ใช้นี้จะสามารถกลับเข้าสู่ระบบได้อีกครั้ง`,
        confirmLabel: 'ยืนยันการเปิดการใช้งาน',
        tone: 'default' as const,
      };
    case 'delete':
      return {
        title: 'ยืนยันการลบผู้ใช้',
        message: `ต้องการลบ ${userName} ออกจาก InsightDocs และ Keycloak ใช่หรือไม่ การดำเนินการนี้ไม่สามารถย้อนกลับได้`,
        confirmLabel: 'ยืนยันการลบ',
        tone: 'danger' as const,
      };
    default:
      return null;
  }
}
