import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { useAuth } from '../../auth/context/useAuth';
import { ErrorModal } from '../../../shared/components/state/ErrorModal';
import { deleteUser, disableUser, enableUser, getUsers } from '../api/usersApi';
import { canDisableUser, canEnableUser, formatUserStatus, getProjectRoleLabels, getProjectRoles, resolveUserStatus, type AppUser } from '../types';
import { StatCard } from '../../../shared/components/ui/StatCard';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { ModuleMockup } from '../../../shared/components/mock/ModuleMockup';
import { FeatureHeroPanel } from '../../../shared/components/mock/FeatureHeroPanel';
import { useTranslation } from '../../../i18n/useTranslation';

type PendingAction =
  | {
      type: 'enable' | 'disable' | 'delete';
      user: AppUser;
    }
  | null;

export function UsersPage() {
  const { accessToken } = useAuth();
  const { language, t } = useTranslation();
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
          setError(loadError instanceof Error ? loadError.message : t('users.loadError'));
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
  }, [accessToken, t]);

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
      setError(actionError instanceof Error ? actionError.message : t('users.actionFailed'));
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
      t('users.deleteSuccess'),
      { remove: true },
    );
  }

  async function handleDisable(user: AppUser) {
    await runRowAction(
      user.id,
      () => disableUser(user.id, accessToken!),
      t('users.disableSuccess'),
    );
  }

  async function handleEnable(user: AppUser) {
    await runRowAction(
      user.id,
      () => enableUser(user.id, accessToken!),
      t('users.enableSuccess'),
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

  const pendingActionCopy = getPendingActionCopy(pendingAction, t);

  return (
    <div className="stack stack--xl">
      <PageHeader
        title={t('users.title')}
        eyebrow={t('users.eyebrow')}
        description={t('users.description')}
        actions={<Link className="button" to="/users/new">{t('users.createAction')}</Link>}
      />

      <ModuleMockup
        eyebrow={t('users.mockupEyebrow')}
        title={t('users.mockupTitle')}
        description={t('users.mockupDescription')}
        highlights={t('users.mockupHighlights').split('|||')}
        steps={t('users.mockupSteps').split('|||')}
        metrics={[
          { label: t('users.totalAccounts'), value: t('approvals.queueItems', { count: users.length }) },
          { label: t('audit.operationalView'), value: t('users.provisionedAccess') },
        ]}
      />

      <FeatureHeroPanel
        eyebrow={t('users.workspaceEyebrow')}
        title={t('users.workspaceTitle')}
        description={t('users.workspaceDescription')}
        actions={[
          { label: t('users.createAction'), to: '/users/new' },
          { label: t('shell.auditLogs'), to: '/audit-logs', tone: 'secondary' },
        ]}
        stats={[
          {
            label: t('users.workspaceActiveLabel'),
            value: users.filter((user) => resolveUserStatus(user.status, user.approvedAt) === 'Active').length,
            detail: t('users.workspaceActiveDetail'),
          },
          {
            label: t('users.workspaceRoleLabel'),
            value: users.reduce((total, user) => total + getProjectRoles(user.roles).length, 0),
            detail: t('users.workspaceRoleDetail'),
          },
          {
            label: t('users.workspaceProvisionLabel'),
            value: t('users.destinationValue'),
            detail: t('users.workspaceProvisionDetail'),
          },
        ]}
      />

      {notice ? <div className="callout">{notice}</div> : null}

      <div className="dashboard-summary-grid">
        <StatCard label={t('users.totalAccounts')} value={users.length} />
        <StatCard label={t('users.activeSigners')} value={users.filter((user) => getProjectRoles(user.roles).includes('insightdocs:signer')).length} />
        <StatCard label={t('users.pendingApproval')} value={users.filter(u => !u.approvedAt).length} />
      </div>

      <section className="panel panel--full stack">
        <div className="section-heading">
          <span className="sidebar__eyebrow">{t('users.title')}</span>
          <h3>{t('users.mockupTitle')}</h3>
        </div>

      {isLoading ? (
        <p className="muted">{t('users.loading')}</p>
      ) : (
        <div className="table-wrap">
          <table className="table table--premium">
            <thead>
              <tr>
                <th>{t('users.listName')}</th>
                <th>{t('users.listEmail')}</th>
                <th>{t('users.listStatus')}</th>
                <th>{t('users.listRoles')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <Link className="users-table__name-link" to={`/users/${user.id}/edit`}>{formatUserName(user)}</Link>
                    <div className="muted users-table__id">ID: {user.id.slice(0, 8)}...</div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <StatusBadge
                      status={resolveUserStatus(user.status, user.approvedAt)}
                      label={formatUserStatus(user.status, user.approvedAt, language)}
                    />
                    <div className="muted users-table__status-note">
                      {user.approvedAt ? t('users.approvedOn', { value: new Date(user.approvedAt).toLocaleDateString() }) : t('users.approvalPending')}
                    </div>
                  </td>
                  <td>
                    {getProjectRoleLabels(user.roles, language).length > 0 ? (
                      <div className="tag-list">
                        {getProjectRoleLabels(user.roles, language).map((role) => (
                          <span key={`${user.id}-${role}`} className="tag">
                            {role}
                          </span>
                        ))}
                      </div>
                    ) : (
                      t('users.noRoles')
                    )}
                  </td>
                  <td>
                    <div className="row-menu">
                      <button
                        className="button button--secondary row-menu__trigger"
                        aria-label={t('users.actionMenuTitle')}
                        disabled={busyUserId === user.id}
                        title={t('users.actionMenuTitle')}
                        type="button"
                        onClick={() => setOpenMenuUserId((current) => (current === user.id ? null : user.id))}
                      >
                        <span className="row-menu__trigger-icon" aria-hidden="true">{busyUserId === user.id ? '⋮' : '⋯'}</span>
                      </button>
                      {openMenuUserId === user.id ? (
                        <div className="topbar__menu-panel row-menu__panel">
                          <p className="row-menu__title">{t('users.actionMenuTitle')}</p>
                          <div className="row-menu__actions">
                            <Link
                              className="topbar__menu-link"
                              to={`/users/${user.id}/edit`}
                              onClick={() => setOpenMenuUserId(null)}
                            >
                              {t('users.editAction')}
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
                                {t('users.disableAction')}
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
                                {t('users.enableAction')}
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
                              {t('users.deleteAction')}
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
              <span className="sidebar__eyebrow">{t('users.confirmEyebrow')}</span>
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
                {busyUserId === pendingAction.user.id ? t('users.saving') : pendingActionCopy.confirmLabel}
              </button>
              <button
                className="button button--secondary"
                disabled={busyUserId === pendingAction.user.id}
                type="button"
                onClick={() => setPendingAction(null)}
              >
                {t('users.cancel')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ErrorModal message={error} onClose={() => setError(null)} />
    </section>
  </div>
);
}

function formatUserName(user: AppUser) {
  const fullName = [user.firstName, user.lastName]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .trim();

  return fullName || user.username;
}

function getPendingActionCopy(pendingAction: PendingAction, t: ReturnType<typeof useTranslation>['t']) {
  if (!pendingAction) {
    return null;
  }

  const userName = formatUserName(pendingAction.user);

  switch (pendingAction.type) {
    case 'disable':
      return {
        title: t('users.confirmDisableTitle'),
        message: t('users.confirmDisableMessage', { name: userName }),
        confirmLabel: t('users.confirmDisableButton'),
        tone: 'default' as const,
      };
    case 'enable':
      return {
        title: t('users.confirmEnableTitle'),
        message: t('users.confirmEnableMessage', { name: userName }),
        confirmLabel: t('users.confirmEnableButton'),
        tone: 'default' as const,
      };
    case 'delete':
      return {
        title: t('users.confirmDeleteTitle'),
        message: t('users.confirmDeleteMessage', { name: userName }),
        confirmLabel: t('users.confirmDeleteButton'),
        tone: 'danger' as const,
      };
    default:
      return null;
  }
}
