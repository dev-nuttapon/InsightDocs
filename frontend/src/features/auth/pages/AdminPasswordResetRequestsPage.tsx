import { useEffect, useState } from 'react';

import { approvePasswordResetRequest, getPasswordResetRequests, rejectPasswordResetRequest, type PasswordResetRequest } from '../api/authApi';
import { useAuth } from '../context/useAuth';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { StatCard } from '../../../shared/components/ui/StatCard';
import { ModuleMockup } from '../../../shared/components/mock/ModuleMockup';
import { FeatureHeroPanel } from '../../../shared/components/mock/FeatureHeroPanel';
import { useTranslation } from '../../../i18n/useTranslation';
import { isDemoModeEnabled } from '../../../shared/mock/demoMode';
import {
  demoApprovePasswordResetRequest,
  demoRejectPasswordResetRequest,
  getDemoPasswordResetRequests,
} from '../../../shared/mock/demoScenario';

export function AdminPasswordResetRequestsPage() {
  const { accessToken } = useAuth();
  const { t } = useTranslation();
  const demoMode = isDemoModeEnabled();
  const [requests, setRequests] = useState<PasswordResetRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (demoMode) {
        if (!ignore) {
          setRequests(getDemoPasswordResetRequests());
          setError(null);
        }
        return;
      }

      if (!accessToken) {
        return;
      }

      try {
        const payload = await getPasswordResetRequests(accessToken);
        if (!ignore) {
          setRequests(payload);
          setError(null);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : t('passwordReset.loadError'));
        }
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, [accessToken, t]);

  async function refresh() {
    if (demoMode) {
      setRequests(getDemoPasswordResetRequests());
      return;
    }

    if (!accessToken) {
      return;
    }

    const payload = await getPasswordResetRequests(accessToken);
    setRequests(payload);
  }

  async function handleApprove(id: string) {
    if (demoMode) {
      const result = demoApprovePasswordResetRequest(id, t('passwordReset.approveComment'));
      await refresh();
      setNotice(result.resetUrl ? t('passwordReset.generatedLink', { url: result.resetUrl }) : t('passwordReset.approvedNotice'));
      setError(null);
      return;
    }

    if (!accessToken) {
      return;
    }

    try {
      const result = await approvePasswordResetRequest(id, t('passwordReset.approveComment'), accessToken);
      await refresh();
      setNotice(result.resetUrl ? t('passwordReset.generatedLink', { url: result.resetUrl }) : t('passwordReset.approvedNotice'));
      setError(null);
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : t('passwordReset.approveError'));
      setNotice(null);
    }
  }

  async function handleReject(id: string) {
    if (demoMode) {
      demoRejectPasswordResetRequest(id, t('passwordReset.rejectComment'));
      await refresh();
      setNotice(t('passwordReset.rejectedNotice'));
      setError(null);
      return;
    }

    if (!accessToken) {
      return;
    }

    try {
      await rejectPasswordResetRequest(id, t('passwordReset.rejectComment'), accessToken);
      await refresh();
      setNotice(t('passwordReset.rejectedNotice'));
      setError(null);
    } catch (rejectError) {
      setError(rejectError instanceof Error ? rejectError.message : t('passwordReset.rejectError'));
      setNotice(null);
    }
  }

  async function handleCopy(resetUrl: string | null) {
    if (!resetUrl) {
      return;
    }

    await navigator.clipboard.writeText(resetUrl);
    setNotice(t('passwordReset.copiedNotice'));
  }

  return (
    <div className="stack stack--xl">
      <PageHeader
        title={t('passwordReset.title')}
        eyebrow={t('passwordReset.eyebrow')}
        description={t('passwordReset.description')}
      />

      <ModuleMockup
        eyebrow={t('passwordReset.mockupEyebrow')}
        title={t('passwordReset.mockupTitle')}
        description={t('passwordReset.mockupDescription')}
        highlights={t('passwordReset.mockupHighlights').split('|||')}
        steps={t('passwordReset.mockupSteps').split('|||')}
        metrics={[
          { label: t('passwordReset.totalRequests'), value: t('approvals.queueItems', { count: requests.length }) },
          { label: t('users.accountDestination'), value: t('passwordReset.manualHandOff') },
        ]}
      />

      <FeatureHeroPanel
        eyebrow={t('passwordReset.workspaceEyebrow')}
        title={t('passwordReset.workspaceTitle')}
        description={t('passwordReset.workspaceDescription')}
        actions={[
          { label: t('shell.users'), to: '/users', tone: 'secondary' },
          { label: t('shell.auditLogs'), to: '/audit-logs', tone: 'secondary' },
        ]}
        stats={[
          {
            label: t('passwordReset.pending'),
            value: requests.filter((request) => request.status === 'Pending').length,
            detail: t('passwordReset.workspacePendingDetail'),
          },
          {
            label: t('passwordReset.approved'),
            value: requests.filter((request) => request.status === 'Approved').length,
            detail: t('passwordReset.workspaceApprovedDetail'),
          },
          {
            label: t('passwordReset.manualHandOff'),
            value: t('passwordReset.workspaceManualValue'),
            detail: t('passwordReset.workspaceManualDetail'),
          },
        ]}
      />

      <div className="dashboard-summary-grid">
        <StatCard label={t('passwordReset.totalRequests')} value={requests.length} />
        <StatCard label={t('passwordReset.pending')} value={requests.filter((request) => request.status === 'Pending').length} />
        <StatCard label={t('passwordReset.approved')} value={requests.filter((request) => request.status === 'Approved').length} />
      </div>

      {error ? <div className="callout callout--danger">{error}</div> : null}
      {notice ? <div className="callout">{notice}</div> : null}

      <section className="panel panel--full stack">
        <div className="workspace-layout">
          <div className="workspace-layout__main stack">
        <div className="section-heading">
          <span className="sidebar__eyebrow">{t('passwordReset.queueEyebrow')}</span>
          <h3>{t('passwordReset.queueTitle')}</h3>
        </div>

        {requests.length === 0 ? (
          <EmptyState 
            title={t('passwordReset.emptyTitle')} 
            description={t('passwordReset.emptyDescription')} 
          />
        ) : (
          <div className="registry-list">
            {requests.map((request) => (
              <article key={request.id} className="registry-item">
                <div className="registry-item__main">
                  <div className="registry-item__header">
                    <div className="stack stack--compact">
                      <div className="registry-item__title">{request.displayName}</div>
                      <p className="muted">{request.email}</p>
                    </div>
                    <StatusBadge status={request.status} label={formatPasswordResetStatus(request.status, t)} />
                  </div>

                  <div className="registry-meta">
                    <span>{t('passwordReset.requestedBy', { value: request.requestedByIdentifier })}</span>
                    <span>{t('passwordReset.requestedDate', { value: new Date(request.requestedAt).toLocaleDateString() })}</span>
                    <span>{t('passwordReset.requestedTime', { value: new Date(request.requestedAt).toLocaleTimeString() })}</span>
                  </div>

                  {request.reviewComment ? (
                    <div className="callout">
                      <strong>{t('passwordReset.reviewComment')}</strong>
                      <div className="muted">{request.reviewComment}</div>
                    </div>
                  ) : null}

                  {request.resetUrl ? (
                    <div className="callout">
                      <strong>{t('passwordReset.resetLink')}</strong>
                      <div className="audit-metadata">
                        <code>{request.resetUrl}</code>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="registry-item__actions registry-item__actions--stack">
                  {request.status === 'Pending' ? (
                    <>
                      <button className="button" type="button" onClick={() => void handleApprove(request.id)}>
                        {t('passwordReset.approve')}
                      </button>
                      <button className="button button--secondary" type="button" onClick={() => void handleReject(request.id)}>
                        {t('passwordReset.reject')}
                      </button>
                    </>
                  ) : null}
                  {request.resetUrl ? (
                    <button className="button button--secondary" type="button" onClick={() => void handleCopy(request.resetUrl)}>
                      {t('passwordReset.copyLink')}
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
          </div>

          <aside className="workspace-layout__side workspace-rail">
            <section className="workspace-rail__panel">
              <span className="sidebar__eyebrow">{t('passwordReset.manualHandOff')}</span>
              <h3>{t('passwordReset.manualHandOff')}</h3>
              <p className="muted">{t('passwordReset.workspaceManualDetail')}</p>
            </section>

            <section className="workspace-rail__panel">
              <span className="card__label">{t('passwordReset.pending')}</span>
              <strong>{requests.filter((request) => request.status === 'Pending').length}</strong>
              <p className="muted">{t('passwordReset.workspacePendingDetail')}</p>
            </section>

            <section className="workspace-rail__panel">
              <span className="card__label">{t('passwordReset.approved')}</span>
              <strong>{requests.filter((request) => request.status === 'Approved').length}</strong>
              <p className="muted">{t('passwordReset.workspaceApprovedDetail')}</p>
            </section>
          </aside>
        </div>
      </section>
    </div>
  );
}

function formatPasswordResetStatus(
  status: PasswordResetRequest['status'],
  t: ReturnType<typeof useTranslation>['t'],
) {
  switch (status) {
    case 'Pending':
      return t('passwordReset.statusPending');
    case 'Approved':
      return t('passwordReset.statusApproved');
    case 'Rejected':
      return t('passwordReset.statusRejected');
    case 'Completed':
      return t('passwordReset.statusCompleted');
    default:
      return status;
  }
}
