import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { StatePanel } from '../../../shared/components/state/StatePanel';
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
          to: '/users',
          label: 'Review users and roles',
          description: 'Manage business roles and application profiles from the admin workspace.',
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
    return <StatePanel eyebrow="Dashboard" title="Loading dashboard" description="Collecting current metrics, recent documents, and operational activity." />;
  }

  return (
    <section className="panel stack">
      <div className="dashboard-hero">
        <div>
          <span className="sidebar__eyebrow">Operational Dashboard</span>
          <h2>Enterprise document operations</h2>
          <p className="muted dashboard-hero__lead">
            Use this dashboard to monitor controlled document activity, route to queues that need attention, and present the current operational state during demos or reviews.
          </p>
        </div>
        <div className="dashboard-badges">
          <span className="status-pill">Active workspace</span>
          <span className="status-pill status-pill--subtle">{user?.username ?? 'Authenticated user'}</span>
        </div>
      </div>

      {error ? <div className="callout callout--danger">{error}</div> : null}

      <div className="dashboard-summary-grid">
        {summaryCards.map((card) => (
          <article key={card.label} className="card card--interactive">
            <span className="card__label">{card.label}</span>
            <strong className="metric-value">{card.value}</strong>
          </article>
        ))}
      </div>

      <div className="hero-grid">
        <article className="card stack">
          <span className="card__label">Quick Actions</span>
          {quickActions.map((action) => (
            <div key={action.to} className="stack stack--compact">
              <strong>{action.label}</strong>
              <span className="muted">{action.description}</span>
              <div className="actions actions--compact">
                <Link className="button" to={action.to}>Open</Link>
              </div>
            </div>
          ))}
        </article>

        <article className="card stack">
          <span className="card__label">Current Session</span>
          <div>Username: {user?.username ?? 'Unavailable'}</div>
          <div>Email: {user?.email ?? 'Unavailable'}</div>
          <div>Roles: {access.normalizedRoles.length > 0 ? access.normalizedRoles.map(formatRoleLabel).join(', ') : 'No mapped roles'}</div>
        </article>
      </div>

      <div className="hero-grid">
        <article className="card stack">
          <span className="card__label">Recent Documents</span>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Status</th>
                  <th>Version</th>
                  <th>Owner</th>
                  <th>Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {recentDocuments.map((document) => (
                  <tr key={document.id}>
                    <td>
                      <Link to={`/documents/${document.id}`}>{document.title}</Link>
                      <div className="muted">{document.category ?? 'Uncategorized'}</div>
                    </td>
                    <td>{document.status}</td>
                    <td>{document.currentVersionNumber ? `v${document.currentVersionNumber}` : 'None'}</td>
                    <td>{document.ownerDisplayName ?? document.controllerDisplayName ?? 'Unassigned'}</td>
                    <td>{new Date(document.lastActivityAt).toLocaleString()}</td>
                  </tr>
                ))}
                {recentDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="muted">No recent documents available.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card stack">
          <span className="card__label">Recent Activities</span>
          {recentActivities.length === 0 ? (
            <p className="muted">No recent activities available.</p>
          ) : (
            recentActivities.map((activity) => (
              <div key={activity.id} className="comment-block">
                <strong>{activity.action}</strong>
                <div className="muted">
                  {activity.actorDisplayName ?? activity.actorUsername ?? 'System'} • {new Date(activity.timestamp).toLocaleString()}
                </div>
                <div className="muted">
                  {activity.relatedDocumentId ? (
                    <Link to={`/documents/${activity.relatedDocumentId}`}>
                      {activity.relatedDocumentTitle ?? 'Open related document'}
                    </Link>
                  ) : (
                    activity.entityType
                  )}
                </div>
              </div>
            ))
          )}
        </article>
      </div>
    </section>
  );
}
