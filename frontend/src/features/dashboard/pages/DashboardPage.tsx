import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { StatePanel } from '../../../shared/components/state/StatePanel';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { StatCard } from '../../../shared/components/ui/StatCard';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { EmptyState } from '../../../shared/components/ui/EmptyState';


import { buildAccessProfile, formatRoleLabel } from '../../../shared/auth/authorization';
import { useAuth } from '../../auth/context/useAuth';
import {
  getDashboardSummary,
  getRecentDashboardActivities,
  getRecentDashboardDocuments,
} from '../api/dashboardApi';
import type {
  DashboardSummary,
  RecentDashboardActivity,
  RecentDashboardDocument,
} from '../types';

export function DashboardPage() {
  const { accessToken, user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentDocuments, setRecentDocuments] = useState<RecentDashboardDocument[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentDashboardActivity[]>([]);
  const [error, setError] = useState<string | null>(null);

  const roles = user?.roles ?? [];
  const access = buildAccessProfile(roles);

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      if (!accessToken) {
        return;
      }

      try {
        const [summaryPayload, documentsPayload, activitiesPayload] = await Promise.all([
          getDashboardSummary(accessToken),
          getRecentDashboardDocuments(accessToken),
          getRecentDashboardActivities(accessToken),
        ]);

        if (!ignore) {
          setSummary(summaryPayload);
          setRecentDocuments(documentsPayload);
          setRecentActivities(activitiesPayload);
          setError(null);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard.');
        }
      }
    }

    void loadDashboard();

    return () => {
      ignore = true;
    };
  }, [accessToken]);

  const quickActions = useMemo(() => {
    const actions = [
      {
        to: '/documents',
        label: access.canManageDocuments ? 'Upload or manage documents' : 'Open document registry',
        description: access.canManageDocuments
          ? 'Continue controlled upload, metadata maintenance, versioning, and archive work.'
          : 'Review current controlled documents and their latest statuses.',
      },
      {
        to: '/search',
        label: 'Search documents',
        description: 'Run metadata and full-text search with enterprise filters.',
      },
    ];

    if (access.canReviewDocuments) {
      actions.push({
        to: '/approvals',
        label: 'Open approvals queue',
        description: 'Review pending submissions and complete approval decisions quickly.',
      });
    }

    if (access.canSignDocuments) {
      actions.push({
        to: '/signatures',
        label: 'Open signatures queue',
        description: 'Inspect pending signer work and complete sequential signing steps.',
      });
    }

    if (access.isAdmin) {
      actions.push(
        {
          to: '/users/new',
          label: 'Invite new user',
          description: 'Provision a new identity to Keycloak and grant initial access roles in InsightDocs.',
        },
        {
          to: '/users',
          label: 'Review users and access',
          description: 'Inspect Keycloak-backed identity, local access state, and approval controls from the admin workspace.',
        },
        {
          to: '/audit-logs',
          label: 'Review audit logs',
          description: 'Inspect append-only operational and compliance events across the system.',
        },
      );
    }

    return actions;
  }, [access.canManageDocuments, access.canReviewDocuments, access.canSignDocuments, access.isAdmin]);

  const summaryCards = [
    { label: 'Total Documents', value: summary?.totalDocuments ?? 0 },
    { label: 'Pending Approvals', value: summary?.pendingApprovals ?? 0 },
    { label: 'Pending Signatures', value: summary?.pendingSignatures ?? 0 },
    { label: 'Approved Documents', value: summary?.approvedDocuments ?? 0 },
    { label: 'Archived Documents', value: summary?.archivedDocuments ?? 0 },
  ];

  if (!summary && !error) {
    return <StatePanel eyebrow="Dashboard" title="Loading dashboard" description="Collecting current metrics, recent documents, and operational activity." busy />;
  }

  return (
    <section className="stack stack--xl">
      <PageHeader
        title="Enterprise document operations"
        eyebrow="Operational Dashboard"
        description="Monitor controlled document activity, route yourself to the next queue, and present the current operational state without hunting across modules."
        actions={
          <div className="dashboard-badges">
            <span className="status-pill">Active workspace</span>
            <span className="status-pill status-pill--subtle">{user?.username ?? 'Authenticated user'}</span>
          </div>
        }
      />

      {error ? <div className="callout callout--danger">{error}</div> : null}

      <div className="panel panel--hero stack">
        <div className="dashboard-summary-grid dashboard-summary-grid--hero">
          {summaryCards.map((card) => (
            <StatCard key={card.label} label={card.label} value={card.value} />
          ))}
        </div>

      </div>

      <div className="split-layout">
        <section className="panel stack">
          <div className="section-heading">
            <span className="sidebar__eyebrow">Quick Actions</span>
            <h3>Continue the next operational step</h3>
          </div>
          <div className="action-list">
            {quickActions.map((action) => (
              <div key={action.to} className="action-row">
                <div className="action-row__copy">
                  <strong>{action.label}</strong>
                  <span className="muted">{action.description}</span>
                </div>
                <Link className="button" to={action.to}>Open</Link>
              </div>
            ))}
          </div>
        </section>

        <section className="panel stack">
          <div className="section-heading">
            <span className="sidebar__eyebrow">Current Session</span>
            <h3>Identity and access snapshot</h3>
          </div>
          <dl className="detail-list">
            <div>
              <dt>Username</dt>
              <dd>{user?.username ?? 'Unavailable'}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user?.email ?? 'Unavailable'}</dd>
            </div>
            <div>
              <dt>Roles</dt>
              <dd>{access.normalizedRoles.length > 0 ? access.normalizedRoles.map(formatRoleLabel).join(', ') : 'No Keycloak roles'}</dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="split-layout split-layout--wide">
        <section className="panel stack">
          <div className="section-heading">
            <span className="sidebar__eyebrow">Recent Documents</span>
            <h3>Latest governed content</h3>
          </div>
          <div className="table-wrap">
            <table className="table table--premium">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Status</th>
                  <th>Activity</th>
                </tr>
              </thead>
              <tbody>
                {recentDocuments.map((document) => (
                  <tr key={document.id}>
                    <td>
                      <Link to={`/documents/${document.id}`} style={{ fontWeight: 700 }}>{document.title}</Link>
                      <div className="muted" style={{ fontSize: '11px' }}>{document.category ?? 'Uncategorized'}</div>
                    </td>
                    <td>
                      <StatusBadge status={document.status} />
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>v{document.currentVersionNumber || '1'}</div>
                      <div className="muted" style={{ fontSize: '11px' }}>{new Date(document.lastActivityAt).toLocaleDateString()}</div>
                    </td>
                  </tr>
                ))}
                {recentDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      <EmptyState 
                        title="No documents" 
                        description="There are no documents in the system yet." 
                      />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel stack">
          <div className="section-heading">
            <span className="sidebar__eyebrow">Recent Activities</span>
            <h3>Latest operational events</h3>
          </div>
          {recentActivities.length === 0 ? (
            <EmptyState 
              title="No activity" 
              description="Recent operational events will appear here." 
            />
          ) : (
            <div className="timeline" style={{ padding: '8px' }}>
              {recentActivities.map((activity) => (
                <div key={activity.id} className="timeline-item">
                  <div className="timeline-item__dot" />
                  <div className="timeline-item__content">
                    <div className="timeline-item__time">{new Date(activity.timestamp).toLocaleTimeString()}</div>
                    <div className="timeline-item__label">{activity.action}</div>
                    <div className="muted" style={{ fontSize: '12px' }}>
                      {activity.relatedDocumentId ? (
                        <Link to={`/documents/${activity.relatedDocumentId}`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                          {activity.relatedDocumentTitle ?? 'Open document'}
                        </Link>
                      ) : (
                        activity.entityType
                      )}
                      {" • "}
                      {activity.actorDisplayName ?? activity.actorUsername ?? 'System'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
