import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../../auth/context/useAuth';
import { ErrorModal } from '../../../shared/components/state/ErrorModal';
import {
  approveUser,
  deleteUser,
  disableUser,
  enableUser,
  getUser,
} from '../api/usersApi';
import { formatUserStatus, getProjectRoleLabels, type AppUser } from '../types';

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<AppUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>((location.state as { notice?: string } | null)?.notice ?? null);
  const [isDeleting, setIsDeleting] = useState(false);

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
  const projectRoles = useMemo(() => getProjectRoleLabels(user?.roles ?? []), [user?.roles]);

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

  async function handleDelete() {
    if (!id || !accessToken) {
      return;
    }

    const confirmed = window.confirm('ยืนยันการลบผู้ใช้งานนี้ออกจาก InsightDocs และ Keycloak?');
    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteUser(id, accessToken);
      navigate('/users', {
        replace: true,
        state: {
          notice: 'ลบผู้ใช้งานสำเร็จ',
        },
      });
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete user.');
      setNotice(null);
    } finally {
      setIsDeleting(false);
    }
  }

  if (!user || !accessToken || !id) {
    return (
      <section className="panel">
        <p className="muted">{error ?? 'Loading user...'}</p>
        <ErrorModal message={error} onClose={() => setError(null)} />
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
        <p className="muted">Status: {formatUserStatus(user.status)} | Approved by: {user.approvedBy ?? 'Not approved yet'}</p>
      </div>

      <div className="callout">
        Identity details and business roles are sourced from Keycloak. This access record is bound to the same UUID as the Keycloak account and cannot be edited separately.
      </div>

      {notice ? <div className="callout">{notice}</div> : null}

      <div className="card stack">
        <span className="card__label">ข้อมูลผู้ใช้งาน</span>
        <div>Username: {user.username}</div>
        <div>Email: {user.email}</div>
        <div>Display name: {user.displayName}</div>
        <div className="actions">
          <Link className="button" to={`/users/${id}/edit`}>แก้ไขผู้ใช้งาน</Link>
        </div>
      </div>

      <div className="card stack">
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

      <div className="actions">
        <button className="button" type="button" onClick={() => void runMutation(() => approveUser(id, accessToken), 'User approved.')}>Approve</button>
        <button className="button button--secondary" type="button" onClick={() => void runMutation(() => disableUser(id, accessToken), 'User disabled.')}>Disable</button>
        <button className="button button--secondary" type="button" onClick={() => void runMutation(() => enableUser(id, accessToken), 'User enabled.')}>Enable</button>
        <button className="button button--secondary" disabled={isDeleting} type="button" onClick={() => void handleDelete()}>
          {isDeleting ? 'Deleting...' : 'Delete User'}
        </button>
      </div>

      <ErrorModal message={error} onClose={() => setError(null)} />
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
